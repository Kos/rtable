# RTable

AJAX-powered table / data grid, powered by React and inspired by JQGrid.

Demos: [Github API][github], [StackOverflow API][stack]

[github]: https://cdn.rawgit.com/Kos/rtable/a8acc6aa/demo.html
[stack]:  https://cdn.rawgit.com/Kos/rtable/a8acc6aa/demo2.html

Design goals:

- Easy to set up and connect to any data source
- Accessible:
    - page refresh and bookmarking works (url is updated as you navigate)
    - control-click on buttons works (navigation is normal links with extra JS on top)

Status: *alpha*, works, has tests, needs more features, ready for some field testing.

## Features

- [x] Columns
- [x] Pagination
- [x] Sorting
- [x] Filtering
- [x] Window history
- [ ] Theming (custom markup)
- [x] Arbitrary data sources

## FAQ

- What is it for?

    - The main use case is displaying data that's fetched from somewhere one page
      at a time, perhaps with server-side filtering and sorting.

- Is it only for use in React apps?

    - Nah. You can use RTable in any page. You'll need to pull React and
      ReactDOM as dependencies, though.

- Can it display data from any API?

    - RTable tries to make as few assumptions about your API as possible,
      allowing you to define how results should be fetched and how the response
      should be displayed. It doesn't even have to be an API: you could also
      connect it to a local or procedurally generated data source.

- Does it play well with Flux / Redux / <yet another hot architecture>?

    - Probably not very much. It's designed to be self-contained and it manages
      its own state. Open an issue if you think we can do better!


## Howto

### Define a data source

A data source for RTable is any object that has a method `get()` that can be
called with a data request, as:

    myDataSource.get({
      page: 2,
      ordering: 'name',
      filters: {
        'size': 10
      }
    });

A data source should return a promise of a json that looks like:

    {
      "count": 20,     // total number of result objects or null
      "next": 3,       // next page id or null
      "previous": 1,   // previous page id or null
      "results": [     // array of result objects
        ...
      ]
    }

You can write your own or use the `AjaxDataSource` helper like so:

    function myDataSource(baseUrl) {
      return new AjaxDataSource({
        baseUrl: baseUrl,
        onResponse: function(response, dataRequest) {
          // response.json
          // response.xhr
          return {
            "count": ...,
            "next": ...,
            "previous": ...,
            "results": [
              ...
            ]
          };
        }
      });
    }

Different APIs use different "response envelope" formats to pass the metadata
together with the data being served. The purpose of the `onResponse` function is
to convert your particular API response into a common format recognised by
RTable.

### Display the RTable

Create a RTable element like:

    ReactDOM.render(
      React.createElement(RTable, {
        dataSource: myDataSource("/myapi/items/"),
        columns: [
          {'label': '#', 'name': 'id'},
          {'label': 'Name', 'name': 'foo'},
          {'label': 'Favourite colour', 'name': 'bar'},
        ],
      }),
      document.getElementById('container')
    );

### Specify columns

Once you pull an array of items from your API, you'll normally want to display
it in a tabular form. Columns allow to pick a part of each row's data,
optionally transform it and present it in the table.

    React.createElement(RTable, {
      columns: [
        ...
      ]
    });

Each column is defined as an object with these fields:

|  field  |                                                                             meaning                                                                              |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`  | Identifier name of the column                                                                                                                                    |
| `label` | Optional. User-presentable name of the column. Will be used in the table header.<br>Defaults to `name`.                                                          |
| `get`   | Optional. Function that takes a single row and returns the column's value. Can return a string or a React component. <br> Defaults to `row => row[column.name]`. |


### Ordering

RTable lets the user to sort a table by clicking a column header. Clicking again
toggles between ascending and descending. In order to enable it, you should
specify which columns should be allowed to order by.

API:

    React.createElement(RTable, {
      columns: [
        {"name": "foo", ...}
        {"name": "bar", ...}
      ],
      ordering: ["foo", "bar"]
    });

The name of the column selected for ordering will be passed to the DataSource as:

`"ordering": "foo" for ascending,
`"ordering": "-foo" for descending.

You can also allow to sort by all columns, instead of listing them:

    React.createElement(RTable, {
      ...
      ordering: "all"
    });


### Filtering

RTable allows to define "filters" that allow the user to narrow down the result
set according to some parameter. Each filter is displayed as a form component.

There are 2 kinds of filters available:

- text: Allow the user to type any value to be filtered on. Displayed as an
  `<input type="text">`.
- choice: Have the user pick one of predefined values. Displayed as a `<select>`.

Either way, the filter's value will be passed to the data source (unless it's null).

API:

    React.createElement(RTable, {
      filters: [
        ...
      ]
    });

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

For choice filters, it generally makes sense to make an "empty" first choice,
but it's not enforced.s

Some shorthands are available:

- '"somechoice"' expands to `{"value": "somechoice"}`
- `null` expands to `{"value": null, "label": "}`


## License

ISC
