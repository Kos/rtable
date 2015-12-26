# RTables

Easy AJAX tables designed for use with Django Rest Framework, powered by React

## Features

- [x] Columns
- [x] Pagination
- [x] Sorting
- [ ] Filtering
- [x] Window history
- [ ] Themes (custom markup)

Misc todos for the future:

- [ ] Multi-sorting
- [ ] Advanced pagination
- [ ] Column identity

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
          {'name': '#', 'key': 'id'},
          {'name': 'Name', 'key': 'foo'},
          {'name': 'Hometown', 'key': 'bar'},
        ],
      }),
      document.getElementById('container')
    );

### Customisation

### Other data sources
