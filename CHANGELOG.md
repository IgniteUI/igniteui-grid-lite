# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** This project is currently in initial development (0.0.x versions). Until version 1.0.0 is released, the public API is not considered stable and breaking changes may occur in any release without following semantic versioning conventions.

## Unreleased


## [0.6.0] - 2026-02-25

### Added

- Updated theming and component size handling across grid styles. [#45](https://github.com/IgniteUI/igniteui-grid-lite/pull/45)

### Changed

- Bumped `igniteui-webcomponents` dependency to `7.0.0`. [#49](https://github.com/IgniteUI/igniteui-grid-lite/pull/49)


## [0.5.0] - 2026-02-17

### Added
- Added `adopt-root-styles` property for adopting document-level styles into shadow DOM when using cell and header templates. [#46](https://github.com/IgniteUI/igniteui-grid-lite/pull/46)

## [0.4.0] - 2026-01-29

### Added

- Added `navigateTo(row, column?, activate?)` API for programmatic navigation/scrolling. [#27](https://github.com/IgniteUI/igniteui-grid-lite/pull/27)
- Support for nested field paths (dot notation) in column `field` (e.g. `address.city`). [#28](https://github.com/IgniteUI/igniteui-grid-lite/pull/28)
- Unified theming with latest `igniteui-webcomponents` implementation with support for scoped theme provider. [#36](https://github.com/IgniteUI/igniteui-grid-lite/pull/36)

### Changed
- Add defaults for generic type params on main types, making specifying those optional [#43](https://github.com/IgniteUI/igniteui-grid-lite/pull/43)

### Fixed

- Cell text ellipsis styling. [#24](https://github.com/IgniteUI/igniteui-grid-lite/pull/24)
- Improve local cell detection logic [#40](https://github.com/IgniteUI/igniteui-grid-lite/pull/40)
- Column `data-type` attribute name. [#33](https://github.com/IgniteUI/igniteui-grid-lite/pull/33)
- Virtualizer layout measurement/rendering under scale transform. [#30](https://github.com/IgniteUI/igniteui-grid-lite/pull/30)
- Declarative columns are now detected even when nested inside a wrapping element. [#35](https://github.com/IgniteUI/igniteui-grid-lite/pull/35)
- Theming controller cleanup on disconnect. [#31](https://github.com/IgniteUI/igniteui-grid-lite/pull/31)

## [0.3.1] - 2025-12-12

### Changed

- **BREAKING:** Removed `updateColumns` method as declarative columns can be updated directly now.

## [0.3.0] - 2025-12-11

### Changed

- **BREAKING:** Column properties have been renamed:
  - `key` → `field` - The field from the data that the column references
  - `type` → `dataType` - The data type of the column's values
  - `headerText` → `header` - The header text of the column

## [0.2.0] - 2025-12-10

### Changed

- **BREAKING:** Column `sort` and `filter` properties have been replaced with separate boolean and configuration properties:
  - `sort` → `sortable` (boolean) + `sortingCaseSensitive` (boolean) + `sortConfiguration` (object with `comparer` option)
  - `filter` → `filterable` (boolean) + `filteringCaseSensitive` (boolean)

- **BREAKING:** Removed `ColumnFilterConfiguration` type. Use `filteringCaseSensitive` boolean property directly on the column.

## [0.1.0] - 2025-12-10

### Changed

- **BREAKING:** Column configuration is now declarative using `<igc-grid-lite-column>` elements instead of the `columns` property.
  The `columns` property is now read-only and returns the current column configuration.

  Before:

  ```html
  <igc-grid-lite .data=${data} .columns=${columns}></igc-grid-lite>
  ```

  ```ts
  const columns: ColumnConfiguration<User>[] = [
    { key: 'id', headerText: 'User ID', type: 'number', filterable: true, sortable: true },
    { key: 'name', filterable: true, sortable: true },
  ];
  ```

  After:

  ```html
  <igc-grid-lite .data=${data}>
    <igc-grid-lite-column
      key="id"
      header-text="User ID"
      type="number"
      filterable
      sortable
    ></igc-grid-lite-column>
    <igc-grid-lite-column
      key="name"
      filterable
      sortable
    ></igc-grid-lite-column>
  </igc-grid-lite>
  ```

- **BREAKING:** Renamed `GridSortConfiguration` type to `GridLiteSortingOptions`.
- **BREAKING:** Renamed `IgcGridLite.sortConfiguration` property to `sortingOptions`.
- **BREAKING:** Renamed `IgcGridLite.sortExpressions` property to `sortingExpressions`.
- **BREAKING:** Renamed `SortExpression` type to `SortingExpression`.
- **BREAKING:** Renamed `BaseSortExpression` type to `BaseSortingExpression`.
- **BREAKING:** `GridLiteSortingOptions.multiple` boolean property has been replaced with `mode` property that accepts `'single'` or `'multiple'` string values.
  - Before: `grid.sortConfiguration = { multiple: true, triState: true }`
  - After: `grid.sortingOptions = { mode: 'multiple' }`

### Removed

- **BREAKING:** `triState` property has been removed from `GridLiteSortingOptions`. Tri-state sorting is now always enabled.

[0.6.0]: https://github.com/IgniteUI/igniteui-grid-lite/compare/0.5.1...0.6.0
[0.5.0]: https://github.com/IgniteUI/igniteui-grid-lite/compare/0.4.0...0.5.0
[0.4.0]: https://github.com/IgniteUI/igniteui-grid-lite/compare/0.3.1...0.4.0
[0.3.1]: https://github.com/IgniteUI/igniteui-grid-lite/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/IgniteUI/igniteui-grid-lite/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/IgniteUI/igniteui-grid-lite/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/IgniteUI/igniteui-grid-lite/releases/tag/0.1.0
