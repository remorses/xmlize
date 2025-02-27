import { ReactElement } from 'react';
import { createJsxXmlComponentElement, createJsxXmlTagElement } from './jsx';
import { isFragment } from 'react-is';
import { createFragment } from '../builtin';

export function reactElementToJsxXmlElement(element: ReactElement) {
  const elementProps: Record<string, any> = element.props as any;
  if (typeof element.type === 'string') {
    // @ts-ignore
    const { key, ref } = element;
    const { children, ...rest } = elementProps;
    const props = { key, ref, ...rest };
    return createJsxXmlTagElement(element.type, props, children);
  }
  if (typeof element.type === 'function') {
    // @ts-ignore
    const { key, ref } = element;
    const { children, ...rest } = elementProps;
    const props = { key, ref, ...rest };
    if (element.type.prototype?.isReactComponent) {
      throw new Error('Class components are not supported');
    }
    // @ts-ignore
    return createJsxXmlComponentElement(element.type, props, children);
  }
  if (isFragment(element)) {
    return createFragment(elementProps.children);
  }
  throw new Error('Unsupported element type: ' + String(element));
}
