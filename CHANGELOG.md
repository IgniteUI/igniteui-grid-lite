# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** This project is currently in initial development (0.0.x versions). Until version 1.0.0 is released, the public API is not considered stable and breaking changes may occur in any release without following semantic versioning conventions.

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
