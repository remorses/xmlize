import { create } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import { XMLBuilderCreateOptions } from 'xmlbuilder2/lib/interfaces';
import { isElement } from 'react-is';
import { reactElementToJsxXmlElement } from './react';
import { JsxXmlElement } from './types';
import { isJsxXmlComponentElement, isJsxXmlTagElement } from './jsx';

import { ReactElement } from 'react';

export async function renderAsync(
  element: ReactElement | JsxXmlElement,
  options?: XMLBuilderCreateOptions,
) {
  let elementsStack: XMLBuilder[] = [];

  function getCurrentElement() {
    return elementsStack[elementsStack.length - 1];
  }

  async function withElement(cur: XMLBuilder, fn: () => void | Promise<void>) {
    try {
      elementsStack.push(cur);
      await fn();
    } finally {
      elementsStack.pop();
    }
  }

  async function renderElement(element: ReactElement | JsxXmlElement) {
    if (element instanceof Promise) {
      element = await element;
    }
    if (isElement(element)) {
      await renderElement(reactElementToJsxXmlElement(element));
    } else if (isJsxXmlTagElement(element)) {
      await renderTagElement(element);
    } else if (isJsxXmlComponentElement(element)) {
      await renderComponentElement(element);
    } else {
      throw new Error('Unsupported element type');
    }
  }

  async function renderTagElement(element: any) {
    let cur = getCurrentElement();
    cur = cur.ele(element.type);
    renderAttrs(cur, element.attrs);
    if (element.children) {
      await withElement(cur, () => renderChildren(element.children));
    }
  }

  function renderAttrs(cur: XMLBuilder, attrs: any) {
    for (let key in attrs) {
      cur.att(key, attrs[key]);
    }
  }

  async function renderComponentElement(element: any) {
    await renderChildren(element.type(element.props));
  }

  async function renderChildren(children: any) {
    const cur = getCurrentElement();
    if (typeof children === 'string') {
      cur.txt(children);
    } else if (typeof children === 'number') {
      cur.txt(children.toString());
    } else if (Array.isArray(children)) {
      await Promise.all(children.map((child) => renderChildren(child)));
    } else if (children) {
      await renderElement(children);
    }
  }
  let cur = create(options ?? {});

  await withElement(cur, () => renderElement(element));

  return cur;
}
