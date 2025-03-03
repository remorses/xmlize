# xmlx

Generate xml string from jsx

[![codecov](https://codecov.io/gh/smmoosavi/xmlx/branch/master/graph/badge.svg)](https://codecov.io/gh/smmoosavi/xmlx)
[![Build Status](https://github.com/smmoosavi/xmlx/actions/workflows/node-ci.yml/badge.svg?branch=main)](https://github.com/smmoosavi/xmlx/actions/workflows/node-ci.yml)

## Install

```bash
npm install xmlx
# or
yarn add xmlx
# or
pnpm add xmlx
```

## Usage

```tsx
import { render } from 'xmlx';
import { expect } from 'vitest';

let xml = render(<test />).end({ headless: true });

expect(xml).toBe(`<test/>`);
```

## API

### `render(jsx, options): XMLBuilder`

- `jsx`: JSX.Element
- `options`: [XMLBuilderCreateOptions](https://oozcitak.github.io/xmlbuilder2/builder-functions.html#builder-options)

The `render` function returns an instance of XMLBuilder. You can call the [end](https://oozcitak.github.io/xmlbuilder2/conversion-functions.html#end) to get the XML string.

### Components

You can define your own components by defining a function that returns a JSX.Element. Component name should start with a capital letter.

```tsx
import { render } from 'xmlx';

function MyComponent(props) {
  return <test>{props.children}</test>;
}

let xml = render(<MyComponent />).end({ headless: true });
```

### Built-in Components

### `CData`

```tsx
import { CData } from 'xmlx';

const value = 1;

let xml = render(
  <test>
    <CData>some text and {value}</CData>
  </test>,
).end({ headless: true });

expect(xml).toBe(`<test><![CDATA[some text and 1]]></test>`);
```

### `Comment`

```tsx
import { Comment } from 'xmlx';

let xml = render(
  <test>
    <Comment>some comment</Comment>
  </test>,
).end({ headless: true });

expect(xml).toBe(`<test><!--some comment--></test>`);
```

### `Ins`

```tsx
import { Ins } from 'xmlx';

let xml = render(
  <test>
    <Ins target="target"></Ins>
    <Ins target="other" content="value"></Ins>
  </test>,
).end({ headless: true });

expect(xml).toBe(`<test><?target?><?other value?></test>`);
```

### `Fragment`

```tsx
import { Fragment } from 'xmlx';

let xml = render(
  <root>
    <Fragment>
      <test />
      <test />
    </Fragment>
  </root>,
).end({ headless: true });

expect(xml).toBe(`<root><test/><test/></root>`);
```

## JSX Transformations

The xmlx supports multiple jsx transformations:

- React element
- automatic jsx transformation
- classic jsx transformation

### React Element

xmlx render function accepts any React element as jsx argument. It helps you to use the xmlx in React projects without extra config.

**Pros:**

- No extra config is required
- it can be used xmlx and React in the same file

**Cons:**

- Order of the `key` and `ref` attrs is not preserved

```tsx
let xml = render(<test before="1" ref="2" key="3" after="4" />).end({
  headless: true,
});

console.log(xml); // <test key="3" ref="2" before="1" after="4"/>
```

- It is not possible to have the `children` attribute

```tsx
let xml2 = render(<test children="attr">child</test>).end({ headless: true });

console.log(xml2); // <test>child</test>
```

- It logs some warnings in the console that do not apply to xmlx

```tsx
const props = { key: '1', other: 'value' };
const xml = render(<test {...props} />).end({ headless: true });

// Warning: A props object containing a "key" prop is being spread into JSX:
```

### Automatic JSX Transformation

xmlx provides automatic jsx transformation. It can be configured in the vite or esbuild config.

To config the whole files in the project:

```tsx
export default defineConfig({
  esbuild: {
    jsxImportSource: 'xmlx',
  },
});
```

Or to config a specific file:

```tsx
// @jsxImportSource xmlx
```

**Pros:**

- No unrelated warnings in the console

**Cons:**

- it can not be used xmlx and React in the same file
- it needs per file config
- it is not possible to have the `children` attribute
- order of the `key` attr is not preserved

```tsx
let xml = render(<test before="1" ref="2" key="3" after="4" />).end({
  headless: true,
});

console.log(xml); // <test key="3" before="1" ref="2" after="4"/>
```

### Classic JSX Transformation

xmlx provides classic jsx transformation. It can be configured in the vite or esbuild config.

To config the whole files in the project:

```tsx
export default defineConfig({
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
});
```

Or to config a specific file:

```tsx
// @jsxRuntime classic
// @jsxFrag Fragment
// @jsx h

import { h, Fragment } from 'xmlx';
```

**Pros:**

- Preserve the order of the `key` and `ref` attrs

```tsx
let xml = render(<test before="1" ref="2" key="3" after="4" />).end({
  headless: true,
});
console.log(xml); // <test before="1" ref="2" key="3" after="4"/>
```

- It is possible to have the `children` attribute

```tsx
let xml = render(<test children="attr">child</test>).end({ headless: true });
console.log(xml); // <test children="attr">child</test>
```

**Cons:**

- It can not be used xmlx and React in the same file
- It needs per file config

### How to choose the transformation

- If your project is not a React project, it is better to use the classic jsx transformation.
- If your project is a React project, it is better to split the xmlx and React code into different files and use the classic jsx transformation for xmlx files.
- If your project is a React project, you can use the React element transformation. if you need `key`, `ref` or `children` attribute, you can use the classic jsx transformation per file.
