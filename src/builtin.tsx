import { ReactNode } from 'react';
import { createJsxXmlComponentElement } from './lib/jsx';
import { joinTextChildren, TextChildren } from './lib/join';
import { getCurrentElement } from './lib/elements-stack';

/**
 * @public
 */
export function Fragment(props: { children?: ReactNode }) {
  return props.children;
}

export function createFragment(children: ReactNode) {
  return createJsxXmlComponentElement(Fragment, {}, children);
}

/**
 * @public
 */
export function Comment(props: { children: TextChildren }) {
  const cur = getCurrentElement();
  const text = joinTextChildren(props.children);
  cur.com(text);
  return null;
}

/**
 * @public
 */
export function CData(props: { children: TextChildren }) {
  const cur = getCurrentElement();
  const text = joinTextChildren(props.children);
  cur.dat(text);
  return null;
}

/**
 * @public
 */
export function Ins(props: { target: string; content?: string }) {
  const cur = getCurrentElement();
  const { target, content = '' } = props;
  cur.ins(target, content);
  return null;
}
