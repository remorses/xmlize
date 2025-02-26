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

  function getCurrentElement() {
    return elementsStack[elementsStack.length - 1];
  }

  const { Comment, CData, Ins } = createBuiltins(getCurrentElement);

  function withElement(
    cur: XMLBuilder,
    fn: () => void | Promise<void>,
  ): Promise<void> {
    elementsStack.push(cur);
    return Promise.resolve(fn()).finally(() => {
      elementsStack.pop();
    });
  }

  function renderElement(
    element: ReactElement | JsxXmlElement,
  ): Promise<void> | void {
    if (element instanceof Promise) {
      return element.then((resolved) => renderElement(resolved));
    }

    if (isElement(element)) {
      return renderElement(reactElementToJsxXmlElement(element));
    } else if (isJsxXmlTagElement(element)) {
      return renderTagElement(element);
    } else if (isJsxXmlComponentElement(element)) {
      return renderComponentElement(element);
    } else {
      return Promise.reject(new Error('Unsupported element type'));
    }
  }

  function renderTagElement(element: any) {
    let cur = getCurrentElement();
    cur = cur.ele(element.type);
    renderAttrs(cur, element.attrs);

    if (element.children) {
      return withElement(cur, () => renderChildren(element.children));
    }
  }

  function renderAttrs(cur: XMLBuilder, attrs: any) {
    for (let key in attrs) {
      cur.att(key, attrs[key]);
    }
  }

  function renderComponentElement(element: any) {
    if (element.type === builtin.Comment) {
      return renderChildren(Comment(element.props));
    }
    if (element.type === builtin.CData) {
      return renderChildren(CData(element.props));
    }
    if (element.type === builtin.Ins) {
      return renderChildren(Ins(element.props));
    }
    return renderChildren(element.type(element.props));
  }

  function renderChildren(children: any): Promise<void> | void {
    const cur = getCurrentElement();

    if (typeof children === 'string') {
      cur.txt(children);
    } else if (typeof children === 'number') {
      cur.txt(children.toString());
    } else if (Array.isArray(children)) {
      return Promise.all(children.map((child) => renderChildren(child))).then(
        () => {},
      );
    } else if (children) {
      return renderElement(children);
    }
  }

  let cur = create(options ?? {});
  await withElement(cur, () => renderElement(element));
  return cur;
}
