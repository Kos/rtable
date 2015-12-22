# RTables

Easy AJAX tables designed for use with Django Rest Framework, powered by React

## Features

- [x] Columns
- [ ] Pagination
- [ ] Sorting
- [ ] Filtering
- [ ] Window history
- [ ] Themes (custom markup)

Misc todos:

- [ ] Column identity

## Howto

### Basic use

Given an AJAX endpoint `/api/data/` that returns a json:

    {
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
