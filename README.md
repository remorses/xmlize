# xmlize

Generate xml from jsx

## Install

```bash
npm install xmlize
# or
yarn add xmlize
# or
pnpm add xmlize
```

## Usage

```tsx
import { render } from 'xmlize';
import { expect } from 'vitest';

let xml = render(<test />).end({ headless: true });

expect(xml).toBe(`<test/>`);
```

## TypeScript types support

You need to define which tags are available in JSX with:

```tsx
declare global {
  // if you don't set jsxImportSource to xmlize you will also need to add `namespace React {` here, but you can't override native HTML tags this way.
  namespace JSX {
    interface ElementChildrenAttribute {
      children?: any;
    }

    interface IntrinsicElements {
      svg: {
        width?: string | number;
        height?: string | number;
        viewBox?: string;
        xmlns?: string;
        version?: string;
        preserveAspectRatio?: string;
        children?: any;
      };
      rect: {
        x?: string | number;
        y?: string | number;
        width?: string | number;
        height?: string | number;
        rx?: string | number;
        ry?: string | number;
        fill?: string;
        stroke?: string;
        strokeWidth?: string | number;
        opacity?: string | number;
        children?: any;
      };
    }
  }
}
```

You will also need to update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "mlxize"
  }
}
```

`xmlize` also works with you don't define `jsxImportSource` but this way it will impossible to override typescript types for already existing HTML tags, this is because typescript will use the React types declarations if you don't pass a custom `jsxImportSource`.

## API

### `render(jsx, options): XMLBuilder`

- `jsx`: JSX.Element
- `options`: [XMLBuilderCreateOptions](https://oozcitak.github.io/xmlbuilder2/builder-functions.html#builder-options)

The `render` function returns an instance of XMLBuilder. You can call the [end](https://oozcitak.github.io/xmlbuilder2/conversion-functions.html#end) to get the XML string.

### Components

You can define your own components by defining a function that returns a JSX.Element. Component name should start with a capital letter.

```tsx
import { render } from 'xmlize';

function MyComponent(props) {
  return <test>{props.children}</test>;
}

let xml = render(<MyComponent />).end({ headless: true });
```

## Async components

Async components are rendered concurrently, meaning if you have 4 components that sleep for 1 second each, renderAsync will return in 1 second only.

```tsx
import { renderAsync } from 'xmlize';

async function AsyncComponent(props) {
  // Simulate async operation
  const data = await fetchData();
  return <item data={data}>{props.children}</item>;
}

async function fetchData() {
  await sleep(1000);
  return 'async-data';
}

// Usage with renderAsync
const xml = await renderAsync(<AsyncComponent>content</AsyncComponent>);
expect(xml).toBe('<item data="async-data">content</item>');
```

## Context

You can use context to pass down props just like React, this works both with render and renderAsync.

```tsx
import { createContext, useContext } from 'xmlize';
import { render } from 'xmlize';
import { expect } from 'vitest';

// Create a context
const ThemeContext = createContext('light');

// Component that uses context
function ThemedComponent() {
  const theme = useContext(ThemeContext);
  return <item theme={theme} />;
}

// Provider component
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <ThemedComponent />
    </ThemeContext.Provider>
  );
}

// Usage
const xml = render(<App />).end({ headless: true });
expect(xml).toBe('<item theme="dark"/>');

// Default value is used when no provider is found
const xmlWithDefaultTheme = render(<ThemedComponent />).end({ headless: true });
expect(xmlWithDefaultTheme).toBe('<item theme="light"/>');
```

### Built-in Components

```tsx
import { CData, Comment, Ins, Fragment } from 'xmlize';
import { render } from 'xmlize';
import { expect } from 'vitest';

// CData example
const value = 1;
let xml1 = render(
  <test>
    <CData>some text and {value}</CData>
  </test>,
).end({ headless: true });
expect(xml1).toBe('<test><![CDATA[some text and 1]]></test>');

// Comment example
let xml2 = render(
  <test>
    <Comment>some comment</Comment>
  </test>,
).end({ headless: true });
expect(xml2).toBe('<test><!--some comment--></test>');

// Ins example
let xml3 = render(
  <test>
    <Ins target="target"></Ins>
    <Ins target="other" content="value"></Ins>
  </test>,
).end({ headless: true });
expect(xml3).toBe('<test><?target?><?other value?></test>');

// Fragment example
let xml4 = render(
  <root>
    <Fragment>
      <test />
      <test />
    </Fragment>
  </root>,
).end({ headless: true });
expect(xml4).toBe('<root><test/><test/></root>');
```
