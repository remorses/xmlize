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

```tsx
import { renderAsync } from 'xmlize';

async function AsyncComponent(props) {
  // Simulate async operation
  const data = await fetchData();
  return <item data={data}>{props.children}</item>;
}

function fetchData() {
  return Promise.resolve('async-data');
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
