import { ReactElement } from 'react';
import { isElement } from 'react-is';
import { create } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import { XMLBuilderCreateOptions } from 'xmlbuilder2/lib/interfaces';
import * as builtin from '../builtin';
import { createBuiltins } from '../builtin';
import { setGlobalContexts } from './context';
import { isJsxXmlComponentElement, isJsxXmlTagElement } from './jsx';
import { reactElementToJsxXmlElement } from './react';
import { JsxXmlElement } from './types';

export function renderAsync(
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
      return element.then((resolved) => {
        setGlobalContexts(ownContext);
        return renderElement(resolved, stack);
      });
    }

    if (isElement(element)) {
      return renderElement(reactElementToJsxXmlElement(element), stack);
    } else if (isJsxXmlTagElement(element)) {
      return renderTagElement(element, stack);
    } else if (isJsxXmlComponentElement(element)) {
      return renderComponentElement(element, stack);
    } else if (
      typeof element === 'object' &&
      element !== null &&
      'node' in element
    ) {
      // Handle XMLBuilder2 node objects returned from components
      getCurrentElement(stack).import(element);
      return element as XMLBuilder;
    } else {
      throw new Error('Unsupported element type: ' + String(element));
    }
  }

  function renderTagElement(
    element: any,
    stack = elementsStack,
  ): Promise<XMLBuilder> | XMLBuilder {
    const parent = getCurrentElement(stack);
    const cur = parent.ele(element.type);
    renderAttrs(cur, element.attrs);

    if (element.children) {
      stack.push(cur);
      let res;

      try {
        res = renderChildren(element.children, stack);
      } finally {
        if (res instanceof Promise) {
          return res.then(() => {
            setGlobalContexts(ownContext);
            stack.pop();
            return cur;
          });
        } else {
          stack.pop();
        }
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
      return res.then((resolved) => {
        setGlobalContexts(ownContext);
        return renderChildren(resolved, stack);
      });
    }
    return renderChildren(res, stack);
  }

  async function renderChildren(
    children: any,
    stack = elementsStack,
  ): Promise<XMLBuilder> {
    const cur = getCurrentElement(stack);

    if (typeof children === 'string') {
      return cur.txt(children);
    } else if (typeof children === 'number') {
      return cur.txt(children.toString());
    } else if (Array.isArray(children)) {
      // Process children sequentially instead of in parallel
      if (children.length === 0) {
        return cur;
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childStack = [...stack];

        const childResult = renderChildren(child, childStack);
        if (childResult instanceof Promise) {
          await childResult;
          setGlobalContexts(ownContext);
        }
      }

      return cur;
    } else if (children) {
      return renderElement(children, stack);
    }
    return cur;
  }

  let cur = create(options ?? {});
  elementsStack.push(cur);

  let ownContext = new Map();
  setGlobalContexts(ownContext);
  let res = renderElement(element, elementsStack);
  if (res instanceof Promise) {
    return res.then(() => {
      return cur;
    });
  }
  return cur;
}
