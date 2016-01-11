# RTable

AJAX-powered table / data grid, powered by React and inspired by JQGrid.

Design goals:

- Easy to set up
- Work out-of-the-box with json endpoints exposed by Django Rest Framework
- Accessible:
    - page refresh and bookmarking works (url is updated as you navigate)
    - control-click on buttons works (navigation is normal links with extra JS on top)

Status: *proof of concept*, needs testing and tidying up.

## Features

- [x] Columns
- [x] Pagination
- [x] Sorting
- [x] Filtering
- [x] Window history
- [ ] Theming (custom markup)
- [ ] Arbitrary data sources

Misc todos for the future:

- [ ] Go to page N
- [ ] Multi-column sorting
- [ ] Multi-choice filtering
- [ ] Advanced pagination (cursors)
- [ ] Primary key column
- [ ] URL param prefixing (allow multiple tables on same page)

## Howto

### Basic use

Given an AJAX endpoint `/api/data/` that returns a json like:

    {
      "count": 45,
      "next": "https://example.com/api/data/?page=2",
      "previous": null,
      "results": [
        {
          id: 732,
          foo: "Dilvish",
          bar: "black"
        },
        {
          id: 485,
          foo: "Mahasamatman",
          bar: "yellow"
        }
      ]
    }

create a component like:

    ReactDOM.render(
      React.createElement(RTable, {
        dataUrl: '/api/data/',
        columns: [
          {'label': '#', 'name': 'id'},
          {'label': 'Name', 'name': 'foo'},
          {'label': 'Favourite colour', 'name': 'bar'},
        ],
      }),
      document.getElementById('container')
    );

### Columns

```
React.createElement(RTable, {
  columns: [
    ...
  ]
});
```

Each column is defined as an object with these fields:

|  field  |                                 meaning                                 |
| ------- | ----------------------------------------------------------------------- |
| `name`  | Identifier name of the column                                           |
| `label` | Optional. Pretty name of the column. Will be used in the table header.\ |
|         | Defaults to `name`.                                                     |
| `get`   | Optional. Function that takes a single row (as JSON) and returns\       |
|         | the column's value. Can return a string or a React component.\          |
|         | Defaults to `row => row[column.name]`.                                  |


### Sorting

...

### Filters

...

## Other data sources

...
