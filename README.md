# Ignite UI Grid Lite
[![Node.js CI](https://github.com/IgniteUI/igniteui-grid-lite/actions/workflows/node.js.yml/badge.svg)](https://github.com/IgniteUI/igniteui-grid-lite/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/IgniteUI/igniteui-grid-lite/badge.svg?branch=master)](https://coveralls.io/github/IgniteUI/igniteui-grid-lite?branch=master)
[![npm version](https://badge.fury.io/js/igniteui-grid-lite.svg)](https://badge.fury.io/js/igniteui-grid-lite)

Ignite UI Grid Lite is a high-performance, lightweight data grid built as a web component using [Lit](https://lit.dev/). It provides essential grid functionality with a small footprint, making it perfect for applications that need fast, efficient data visualization without the overhead of a full-featured grid.

## Table of Contents
- [Features](#features)
- [Browser Support](#browser-support)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Building the Library](#building-the-library)
- [Running Tests](#running-tests)
- [Documentation](#documentation)
- [Ignite UI Grid Lite vs. Ignite UI for Angular](#ignite-ui-grid-lite-vs-ignite-ui-for-angular)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Features

Ignite UI Grid Lite provides core data grid capabilities with an emphasis on performance and simplicity:

- **High Performance Row Virtualization** - Handles large datasets efficiently with built-in virtual scrolling
- **Column Filtering** - Built-in column filtering capabilities
- **Sorting** - Column sorting support for better data organization
- **Lightweight** - Minimal bundle size for fast load times
- **Web Standards** - Built with web components for framework-agnostic usage
- **Modern Architecture** - Built with Lit and TypeScript for maintainability
- **Customizable** - Flexible theming and styling options
- **Cell Templating** - Custom cell rendering for flexible data display
- **Header Templating** - Custom header rendering for enhanced grid headers
- **Accessible** - Designed with accessibility in mind

## Browser Support

Ignite UI Grid Lite supports all modern browsers:

| ![chrome] | ![firefox] | ![edge] | ![safari] | ![opera] |
|:---:|:---:|:---:|:---:|:---:|
| Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ |

## Getting Started

### Installation

Install via npm:

```bash
npm install igniteui-grid-lite
```

### Quick Start

1. Import the grid component in your JavaScript/TypeScript file:

```typescript
import 'igniteui-grid-lite';
```

2. Use the grid in your HTML:

```html
<igc-grid-lite>
  <!-- Grid configuration here -->
</igc-grid-lite>
```

3. For a complete example, check out the [demo application](./demo).

## Usage

For detailed usage instructions and API documentation, visit:
- <a href="https://www.infragistics.com/products/ignite-ui-web-components/web-components/components/grid-lite/overview">Grid Lite Overview</a>
- [API Documentation](https://igniteui.github.io/igniteui-grid-lite/)

## Building the Library

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/IgniteUI/igniteui-grid-lite.git
cd igniteui-grid-lite
npm install
```

### Build

To build the library:

```bash
npm run build
```

This will:
- Analyze custom elements
- Build the TypeScript source
- Generate API documentation

### Development

Start the development server with live reload:

```bash
npm start
```

This will open the demo page at `demo/index.html` with automatic rebuilding on file changes.

## Running Tests

Run tests once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Tests are written using [@web/test-runner](https://modern-web.dev/docs/test-runner/overview/) and [@open-wc/testing](https://open-wc.org/docs/testing/helpers/).

## Documentation

### API Documentation

The API documentation is generated using [TypeDoc](https://typedoc.org/). To build the docs:

```bash
npm run build
```

Documentation will be available in the build output.

### Additional Resources

- <a href="https://www.infragistics.com/products/ignite-ui-web-components/web-components/components/general-getting-started">Ignite UI Web Components Product Documentation</a>
- <a href="https://www.infragistics.com/products/ignite-ui-web-components/web-components/components/grid-lite/overview">Grid Lite Documentation</a>
- [Web Components Guide](https://lit.dev/)

## Ignite UI Grid Lite vs. Ignite UI for Angular

Ignite UI Grid Lite is designed as a lightweight, open-source alternative to the full-featured <a href="https://www.infragistics.com/products/ignite-ui-web-components/web-components/components/grids/data-grid">Ignite UI for Web Components Data Grid</a>, while allowing for an easy swap with the full-featured grid, if application needs require it.

### Ignite UI Grid Lite (Open Source - MIT)

**Best for:**
- Applications requiring basic grid functionality
- Projects where bundle size is critical
- Framework-agnostic web applications
- Community-driven development

**Includes:**
- Core data virtualization
- Basic filtering and sorting
- Lightweight and fast
- MIT licensed and free for all use

**Best for:**
- Enterprise applications requiring advanced features
- Complex data scenarios with editing, grouping, and aggregation
- Applications needing professional support and SLA

**Includes:**
- All Grid Lite features plus:
  - Advanced filtering with query builder
  - Excel-style column filtering
  - Grouping
  - Cell editing, row editing, batch editing
  - Summaries and aggregations
  - Excel, PDF, and CSV export
  - Column pinning, hiding, and resizing
  - Row selection
  - Paging
  - Multi-column headers and collapsible column groups
  - Cell merging
  - Custom row layouts
  - Master-detail views
  - Hierarchical grid
  - Tree grid
  - Pivot grid
  - 24/5 developer support

<a href="https://www.infragistics.com/products/ignite-ui-web-components/web-components/components/general-open-source-vs-premium">Learn more about Open-Source vs Premium Ignite UI options</a>

## Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for details on:
- Code of conduct
- Development workflow
- Submitting pull requests
- Coding standards

To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

### Community Support

Community support for open source usage of this product is available at:
- [GitHub Issues](https://github.com/IgniteUI/igniteui-grid-lite/issues) - Report bugs or request features
- [Stack Overflow](https://stackoverflow.com/questions/tagged/igniteui) - Ask questions using the `igniteui` tag

### Commercial Support

For professional support and access to the full Ignite UI for Web Components suite with advanced grid features:
- Visit [Infragistics Support](https://www.infragistics.com/support)
- Explore [Ignite UI for Web Components](https://www.infragistics.com/products/ignite-ui-web-components)
- [Register for a trial](https://www.infragistics.com/products/ignite-ui-web-components/web-components/components/general-getting-started)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**MIT License** - Free for commercial and non-commercial use.

© Copyright 2025 INFRAGISTICS. All Rights Reserved.

For the commercial Ignite UI for Angular product, please visit [Infragistics Licensing](https://www.infragistics.com/legal/license).

---

**Built with ❤️ by [Infragistics](https://www.infragistics.com/)**

<!-- Browser Logos -->
[chrome]: https://user-images.githubusercontent.com/2188411/168109445-fbd7b217-35f9-44d1-8002-1eb97e39cdc6.png "Google Chrome"
[firefox]: https://user-images.githubusercontent.com/2188411/168109465-e46305ee-f69f-4fa5-8f4a-14876f7fd3ca.png "Mozilla Firefox"
[edge]: https://user-images.githubusercontent.com/2188411/168109472-a730f8c0-3822-4ae6-9f54-785a66695245.png "Microsoft Edge"
[opera]: https://user-images.githubusercontent.com/2188411/168109520-b6865a6c-b69f-44a4-9948-748d8afd687c.png "Opera"
[safari]: https://user-images.githubusercontent.com/2188411/168109527-6c58f2cf-7386-4b97-98b1-cfe0ab4e8626.png "Safari"
