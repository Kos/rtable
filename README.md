# RTable

AJAX-powered table / data grid, powered by React and inspired by JQGrid.

[See the demo](https://rawgit.com/Kos/rtable/3fd6638/demo.html)

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

## FAQ

- What is it for?

  - The main use case is displaying data that's fetched from somewhere one page
    at a time, perhaps with server-side filtering and sorting.

- Is it only for use in React apps?
    - Nah. You can use RTable in any page. You'll need to pull React and
      ReactDOM as dependencies, though.

- Is it only for use with Django Rest Framework?
    - Nah, it's easy to make it work with any data source. But by default, it
      expects something like:

      ```
      GET /my/api/url/?page=1&ordering=name&country=pl

      {
        "count": 402,
        "next": "... url of next page ..."
        "previous": null,
        "results": [
          {"id": 321, "name": "Jacek Placek", "country": "pl"},
          {"id": 567, "name": "Paweł Gaweł", "country": "pl"}
        ]
      }
      ```

- Does it play well with Flux / Redux / <yet another hot architecture>?

    - Probably not very much. It's designed to be self-contained and it manages
      its own state. Open an issue if you think we can do better!


## Misc Todos

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

|  field  |                                                                                  meaning                                                                                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`  | Identifier name of the column                                                                                                                                              |
| `label` | Optional. User-presentable name of the column. Will be used in the table header.<br>Defaults to `name`.                                                                    |
| `get`   | Optional. Function that takes a single row (as JSON) and returns the column's value. Can return a string or a React component. <br> Defaults to `row => row[column.name]`. |


### Sorting

...

### Filters

There are 2 kinds of filters available:

- text: `<input type="text">`
- choice: `<select>`

(There could be more! A checkbox might work nice)

```
React.createElement(RTable, {
  filters: [
    ...
  ]
});
```

Each filter is defined as an object with these fields:

|   field   |                                                           meaning                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `name`    | Identifier. Corresponds to the url parameter that will be set to this filter's value.                                       |
| `label`   | Optional. User-presentable name of the filter field. Defaults to `name`.                                                    |
| `choices` | Optional. List of choice objects. <br> If `choices` are given, the filter is a choice filter, otherwise it's a text filter. |

Each filter choice is defined as an object with these fields:

|  field  |                                                                 meaning                                                                  |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `value` | Corresponds to the url parameter value that will be set when this choice is selected.<br>`null` means that this filter won't be applied. |
| `label` | Optional. User-presentable text for this choice. Defaults to `value`.                                                                    |

For choice filters, it makes sense to make an empty first choice, but it's not enforced.

## Other data sources

...
