export { render } from './lib/render.js';
export { Fragment, Comment, CData, Ins } from './builtin.js';

export { createElement } from './lib/runtime.js';
export { JSXXML, JSXXML as h } from './lib/runtime.js';
export {
  getCurrentElement as _getCurrentElement,
  withElement as _withElement,
} from './lib/elements-stack.js';

export type { TextChildren, TextChild } from './lib/join.js';
export type {
  JsxXmlElement,
  JsxXmlComponentElement,
  JsxXmlTagElement,
} from './lib/types.js';

export { renderAsync } from './lib/render-async.js';
export { createContext, useContext } from './lib/context.js';
export type { Context } from './lib/context.js';
