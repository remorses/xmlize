import { create } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import { XMLBuilderCreateOptions } from 'xmlbuilder2/lib/interfaces';
import { isElement } from 'react-is';
import { reactElementToJsxXmlElement } from './react';
import { JsxXmlElement } from './types';
import { isJsxXmlComponentElement, isJsxXmlTagElement } from './jsx';
import * as builtin from '../builtin';
import { ReactElement } from 'react';
import { createBuiltins } from '../builtin';

export async function renderAsync(
  element: ReactElement | JsxXmlElement,
  options?: XMLBuilderCreateOptions,
) {
  let elementsStack: XMLBuilder[] = [];

  function getCurrentElement(stack = elementsStack) {
    return stack[stack.length - 1];
  }

  async function withElement<T>(
    cur: XMLBuilder,
    fn: () => Promise<T> | T,
    stack = elementsStack,
  ): Promise<T> {
    stack.push(cur);
    try {
      return await fn();
    } finally {
      stack.pop();
    }
  }

  function renderElement(
    element: ReactElement | JsxXmlElement,
    stack = elementsStack,
  ): Promise<XMLBuilder> {
    if (element instanceof Promise) {
      return element.then((resolved) => renderElement(resolved, stack));
    }

    if (isElement(element)) {
      return renderElement(reactElementToJsxXmlElement(element), stack);
    } else if (isJsxXmlTagElement(element)) {
      return renderTagElement(element, stack);
    } else if (isJsxXmlComponentElement(element)) {
      return renderComponentElement(element, stack);
    } else {
      throw new Error('Unsupported element type');
    }
  }

  async function renderTagElement(
    element: any,
    stack = elementsStack,
  ): Promise<XMLBuilder> {
    const parent = getCurrentElement(stack);
    const cur = parent.ele(element.type);
    renderAttrs(cur, element.attrs);

    if (element.children) {
      await withElement(
        cur,
        () => renderChildren(element.children, stack),
        stack,
      );
    }
    return cur;
  }

  function renderAttrs(cur: XMLBuilder, attrs: any) {
    for (let key in attrs) {
      cur.att(key, attrs[key]);
    }
  }

  async function renderComponentElement(
    element: any,
    stack = elementsStack,
  ): Promise<XMLBuilder> {
    const getter = () => getCurrentElement(stack);

    if (element.type === builtin.Comment) {
      const { Comment } = createBuiltins(getter);
      return await renderChildren(Comment(element.props), stack);
    }
    if (element.type === builtin.CData) {
      const { CData } = createBuiltins(getter);
      return await renderChildren(CData(element.props), stack);
    }
    if (element.type === builtin.Ins) {
      const { Ins } = createBuiltins(getter);
      return await renderChildren(Ins(element.props), stack);
    }
    return renderChildren(await element.type(element.props), stack);
  }

  async function renderChildren(
    children: any,
    stack = elementsStack,
  ): Promise<XMLBuilder> {
    const cur = getCurrentElement(stack);

    if (typeof children === 'string') {
      cur.txt(children);
    } else if (typeof children === 'number') {
      cur.txt(children.toString());
    } else if (Array.isArray(children)) {
      const elements = await Promise.all(
        children.map((child) => {
          const childStack = [...stack];
          return renderChildren(child, childStack);
        }),
      );
      // reorder elements to be same as promise.all
      cur.toArray(false).forEach((x) => {
        // Skip removing comments, CDATA sections, and processing instructions
        if (
          x.node.nodeType !== 8 && // Comment
          x.node.nodeType !== 4 && // CDATA
          x.node.nodeType !== 7 // Ins
        ) {
          x.remove();
        }
      });
      for (const element of elements) {
        // Skip importing if element is the same as cur to avoid circular references
        if (element !== cur) {
          cur.import(element);
        }
      }
      return cur;
    } else if (children) {
      return await renderElement(children, stack);
    }
    return cur;
  }

  let cur = create(options ?? {});
  await withElement(cur, () => renderElement(element), elementsStack);
  return cur;
}
