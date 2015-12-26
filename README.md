# RTables

Easy AJAX tables designed for use with Django Rest Framework, powered by React

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

Given an AJAX endpoint `/api/data/` that returns a json:

    {
      ""
      "results": [
        {
          foo: "Xmwpxktj",
          bar: "Wgtdpoicbjhpqfesc",
          id: 732
        },
        {
          foo: "Efrsfwudbgwdmb",
          bar: "Typlapiokriooygupu",
          id: 485
        }
      ]
    }


create a component like:

    ReactDOM.render(
      React.createElement(RTable, {
        dataUrl: '/api/data/',
        columns: [
          {'label': '#', 'key': 'id'},
          {'label': 'Name', 'key': 'foo'},
          {'label': 'Hometown', 'key': 'bar'},
        ],
      }),
      document.getElementById('container')
    );

### Customisation

### Other data sources
