# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** This project is currently in initial development (0.0.x versions). Until version 1.0.0 is released, the public API is not considered stable and breaking changes may occur in any release without following semantic versioning conventions.

## [Unreleased]

### Changed

- **BREAKING:** Column configuration is now declarative using `<igc-grid-lite-column>` elements instead of the `columns` property.
  The `columns` property is now read-only and returns the current column configuration.

  Before:

  ```html
  <igc-grid-lite .data=${data} .columns=${columns}></igc-grid-lite>
  ```

  ```ts
  const columns: ColumnConfiguration<User>[] = [
    { key: 'id', headerText: 'User ID', type: 'number', filter: true, sort: true },
    { key: 'name', filter: true, sort: true },
  ];
  ```

  After:

  ```html
  <igc-grid-lite .data=${data}>
    <igc-grid-lite-column
      key="id"
      header-text="User ID"
      type="number"
      .filter=${true}
      .sort=${true}
    ></igc-grid-lite-column>
    <igc-grid-lite-column
      key="name"
      .filter=${true}
      .sort=${true}
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
