import { ReactElement } from 'react';
import { isElement } from 'react-is';
import { create } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import { XMLBuilderCreateOptions } from 'xmlbuilder2/lib/interfaces';
import * as builtin from '../builtin';
import { createBuiltins } from '../builtin';
import { isJsxXmlComponentElement, isJsxXmlTagElement } from './jsx';
import { reactElementToJsxXmlElement } from './react';
import { JsxXmlElement } from './types';

export async function renderAsync(
  element: ReactElement | JsxXmlElement,
  options?: XMLBuilderCreateOptions,
) {
  let elementsStack: XMLBuilder[] = [];

  function getCurrentElement(stack = elementsStack) {
    return stack[stack.length - 1];
  }

  function renderElement(
    element: ReactElement | JsxXmlElement,
    stack = elementsStack,
  ): Promise<XMLBuilder> | XMLBuilder {
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
      throw new Error('Unsupported element type: ' + element);
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
      stack.push(cur);
      try {
        await renderChildren(element.children, stack);
      } finally {
        stack.pop();
      }
    }
    return cur;
  }

  function renderAttrs(cur: XMLBuilder, attrs: any) {
    for (let key in attrs) {
      cur.att(key, attrs[key]);
    }
  }

  function renderComponentElement(
    element: any,
    stack = elementsStack,
  ): Promise<XMLBuilder> | XMLBuilder {
    const getter = () => getCurrentElement(stack);

    if (element.type === builtin.Comment) {
      const { Comment } = createBuiltins(getter);
      return renderChildren(Comment(element.props), stack);
    }
    if (element.type === builtin.CData) {
      const { CData } = createBuiltins(getter);
      return renderChildren(CData(element.props), stack);
    }
    if (element.type === builtin.Ins) {
      const { Ins } = createBuiltins(getter);
      return renderChildren(Ins(element.props), stack);
    }
    let res = element.type(element.props);
    if (res instanceof Promise) {
      return res.then((resolved) => renderChildren(resolved, stack));
    }
    return renderChildren(res, stack);
  }

  function renderChildren(
    children: any,
    stack = elementsStack,
  ): Promise<XMLBuilder> | XMLBuilder {
    const cur = getCurrentElement(stack);

    if (typeof children === 'string') {
      cur.txt(children);
    } else if (typeof children === 'number') {
      cur.txt(children.toString());
    } else if (Array.isArray(children)) {
      return Promise.all(
        children.map((child) => {
          const childStack = [...stack];
          return renderChildren(child, childStack);
        }),
      ).then((elements) => {
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

        elements.forEach((element) => {
          // Skip importing if element is the same as cur to avoid circular references
          if (element !== cur) {
            cur.import(element);
          }
        });

        return cur;
      });
    } else if (children) {
      return renderElement(children, stack);
    }
    return cur;
  }

  let cur = create(options ?? {});
  elementsStack.push(cur);
  await renderElement(element, elementsStack);
  return cur;
}
