/* global React, ReactDOM */
/* global RTable, AjaxDataSource, AjaxDataSourceResponse */
/* global sinon */

let ReactTestUtils = React.addons.TestUtils;


describe("RTable", function() {
  beforeEach(function() {
    let d = document.getElementById('container');
    if (d) {
      d.parentNode.removeChild(d);
    }
    d = document.createElement('div');
    d.id = 'container';
    document.body.insertBefore(d, document.body.children[0]);
    this.requests = [];
    spyOn(window.DefaultDataSource.prototype, 'get').and.callFake(dataRequest => {
      const promise = new MockPromise();
      this.requests.push({
        dataRequest, promise,
        url: mockUrl(dataRequest),
        respond: function(data) { this.promise.resolveNow(data); }
      });
      return promise;
      function mockUrl(dataRequest) {
        // TODO drop this hack, have tests look at the dataRequest object
        let flatDataRequest = Object.assign(
        {},
        {page: dataRequest.page, ordering: dataRequest.ordering},
        dataRequest.filters);
        return window.updateQueryStringMultiple(flatDataRequest, '/api');
      }
    });
    spyOn(window.history, 'replaceState');
  });

  describe("interactivity", function() {
    beforeEach(function() {
      this.clock = sinon.useFakeTimers();
    });
    afterEach(function() {
      this.clock.restore();
    });

    it("should download initial data", function() {
      UI.create({});
      expect(this.requests[0].url).toEqual('/api?page=1'); // drop 1?
    });
    it("should take data from window url", function() {
      UI.create({}, "?page=3&foo=bar");
      expect(this.requests[0].url).toEqual('/api?page=3&foo=bar'); // ?
    });
    it("should paginate", function() {
      UI.create({"columns": [{"name": "foo"}]});
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      });
      UI.nextPage();
      expect(this.requests[1].url).toEqual('/api?page=2');
    });
    it("should sort", function() {
      UI.create({"columns": [{"name": "foo", "label": "Foo"}], "ordering": "all"});
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      });
      UI.orderByIndex(0);
      expect(this.requests[1].url).toEqual('/api?page=1&ordering=foo');
      this.requests[1].respond({
        count: 10, next: "/api?page=2&ordering=foo", previous: null, results: rows(5)
      });
      UI.orderByIndex(0);
      expect(this.requests[2].url).toEqual('/api?page=1&ordering=-foo');
    });
    it("should filter selects immediately", function() {
      UI.create({"columns": [{"name": "foo", "label": "Foo"}],
                 "filters": [{"name": "foo", "label": "Foofilter", "choices": [
                   {"label": "---", "value": "choice"},
                   {"label": "ChoiceA", "value": "choice-a"},
                   {"label": "ChoiceB", "value": "choice-b"}
                 ]}]});
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      });
      UI.filterByIndex('select', 0, "choice-b");
      expect(this.requests[1].url).toEqual('/api?page=1&foo=choice-b');
    });
    it("should filter selects with value=null", function() {
      UI.create({"columns": [{"name": "foo", "label": "Foo"}],
                 "filters": [{"name": "baz", "label": "Foofilter", "choices": [
                   {"label": "---", "value": null},
                   {"label": "ChoiceA", "value": "choice-a"}
                 ]}]}, "?page=1&baz=choice-a");
      expect(this.requests[0].url).toEqual('/api?page=1&baz=choice-a');
      this.requests[0].respond({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      });
      UI.filterByIndex('select', 0, "");
      expect(this.requests[1].url).toEqual('/api?page=1');
    });
    it("should filter inputs with a delay", function() {
      UI.create({"columns": [{"name": "foo", "label": "Foo"}],
                 "filters": [{"name": "baz", "label": "Foofilter"}]});
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      });
      UI.filterByIndex('input', 0, "quux");
      expect(this.requests.length).toEqual(1);
      this.clock.tick(799);
      expect(this.requests.length).toEqual(1);
      this.clock.tick(1);
      expect(this.requests.length).toEqual(2);
      expect(this.requests[1].url).toEqual('/api?page=1&baz=quux');
    });
  });

  describe("rendering", function() {
    beforeEach(function() {
      this.renderWithData = function({props, results}) {
        return this.renderWithResponse({props: props, response: {
          'count': results.length, 'next': null, 'previous': null,
          'results': results}});
      };
      this.renderWithResponse = function({props, response}) {
        let rtable = ReactTestUtils.renderIntoDocument(<RTable {...props} /> );
        this.requests[0].respond(response);
        return rtable;
      };
    });
    it("should render", function() {
      let rtable = this.renderWithData({
        props: {
          dataUrl: "/api",
          columns: []
        },
        results: []
      });
      expect(rtable.refs.columnHeaderRow.children.length).toEqual(0);
      expect(rtable.refs.rowContainer.children.length).toEqual(0);
    });
    it("should render row values", function() {
      let rtable = this.renderWithData({
        props: {
          dataUrl: "/api",
          columns: [
            {'name': 'exampleColumn', 'label': 'Example column'},
            {'name': 'columnWithGetFunction', 'label': 'Column with key', 'get': () => 'getFunctionValue'}
          ]
        },
        results: [{
          'exampleColumn': 'exampleValue',
          'anotherColumn': 'anotherValue'
        }]
      });
      expect(rtable.refs.rowContainer.children.length).toEqual(1);
      let row = rtable.refs.rowContainer.children[0];
      expect(row.children.length).toEqual(2);
      expect(row.children[0].tagName).toEqual('TD');
      expect(row.children[0].textContent).toEqual('exampleValue');
      expect(row.children[1].tagName).toEqual('TD');
      expect(row.children[1].textContent).toEqual('getFunctionValue');
    });
    it("should render column headers", function() {
      let rtable = this.renderWithData({
        props: {
          dataUrl: "/api",
          columns: [
            {'name': 'first', 'label': 'First column'},
            {'name': 'second'}
          ]
        },
        results: []
      });
      let headers = rtable.refs.columnHeaderRow.children;
      expect(headers.length).toEqual(2);
      expect(headers[0].tagName).toEqual('TH');
      expect(headers[0].textContent).toEqual('First column');
      expect(headers[1].tagName).toEqual('TH');
      expect(headers[1].textContent).toEqual('second');
    });
    it("should render classes", function() {
      // TODO opt-in configurable class names, don't just default to Boostrap
      let rtable = this.renderWithData({
        props: {
          dataUrl: "/api",
          columns: [
            {'name': 'col'}
          ],
          filters: [
            {'name': 'flt'},
            {'name': 'flt2', 'choices': [{'value': 'asdf'}]}
          ]
        },
        results: [{'col': 123}]
      });
      let expectClasses = e => expect([].slice.call(e.classList));
      let table = ReactDOM.findDOMNode(rtable);
      expectClasses(table).toEqual(['table', 'table-striped', 'table-hover']);
      expectClasses(rtable.refs.paginationContainer).toEqual(['text-center']);
      expectClasses(rtable.refs.columnHeaderRow).toEqual([]);
      expectClasses(rtable.refs.filterRow).toEqual([]);
      expectClasses(rtable.refs.filterRow.children[0]).toEqual(['form-inline']);
      expectClasses(rtable.refs.filterRow.querySelector('input')).toEqual(['form-control', 'input-sm']);
      expectClasses(rtable.refs.filterRow.querySelector('select')).toEqual(['form-control', 'input-sm']);
      expectClasses(rtable.refs.rowContainer).toEqual([]);
      // TODO drop t-next, t-prev
      expectClasses(rtable.refs.paginationNext).toEqual(['btn', 'btn-primary', 't-next']);
      expectClasses(rtable.refs.paginationPrevious).toEqual(['btn', 'btn-primary', 't-prev']);
    });
    it("should render initial ordering", function() {
      let location = "/?ordering=-foo";
      spyOn(window.DataLoader.prototype, 'getWindowLocation').and.returnValue(location);
      let rtable = this.renderWithData({
        props: {
          dataUrl: "/api",
          columns: [{'name': 'foo'}]
        },
        results: []
      });
      expect(rtable.refs.columnHeaderRow.children[0].textContent).toEqual('foo' + '\u25BC');
    });
    it("should render initial filter values", function() {
      let location = "/?filter1=f1value&filter2=f2value";
      spyOn(window.DataLoader.prototype, 'getWindowLocation').and.returnValue(location);
      let rtable = this.renderWithData({
        props: {
          dataUrl: "/api",
          columns: [],
          filters: [
            {'name': 'filter1'},
            {'name': 'filter2', 'choices': [
              {'value': 'whatever'},
              {'value': 'f2value'}]}
          ]
        },
        results: []
      });
      let input = rtable.refs.filterRow.querySelector("input");
      let select = rtable.refs.filterRow.querySelector("select");
      expect(input.value).toEqual("f1value");
      expect(select.value).toEqual("f2value");
    });
    it("should render pagination buttons", function() {
      let location = "http://example.com/?unrelated=bar";
      spyOn(window.DataLoader.prototype, 'getWindowLocation').and.returnValue(location);
      let rtable = this.renderWithResponse({
        props: {
          dataUrl: "http://example.com/data",
          columns: [],
          filters: []
        },
        response: {
          count: 10,
          next: "nextPageId",
          previous: "prevPageId",
          results: [1, 2, 3]
        }
      });
      let buttonNext = rtable.refs.paginationNext;
      let buttonPrevious = rtable.refs.paginationPrevious;
      expect(buttonNext.href).toContain("?unrelated=bar&page=nextPageId");
      expect(buttonPrevious.href).toContain("?unrelated=bar&page=prevPageId");
      // TODO expect them to be relative links - buttonNext.href is absolute,
      // even though relative is rendered (?)
    });
  });
});

describe("AjaxDataSource", function() {
  it("should GET baseUrl and call onResponse", function() {
    let params = {
      baseUrl: "http://example.com/foo",
      onResponse: jasmine.createSpy('onResponse')
    };
    let dataRequest = {
      'page': 1,
      'ordering' : '-quux',
      'filters': {'foo': 'bar'},
      'flatten': () => ({'page': 1, 'ordering': '-quux', 'foo': 'bar'})
    };
    let ajaxGetPromise = new MockPromise();
    let ajaxGet = spyOn(window, 'ajaxGet').and.returnValue(ajaxGetPromise);
    new AjaxDataSource(params).get(dataRequest);
    expect(ajaxGet).toHaveBeenCalledWith(
      "http://example.com/foo?page=1&ordering=-quux&foo=bar");

    let response = {};
    let AjaxDataSourceResponse = spyOn(window, 'AjaxDataSourceResponse')
      .and.returnValue(response);
    ajaxGetPromise.resolveNow('xhr');
    expect(AjaxDataSourceResponse).toHaveBeenCalledWith('xhr');
    expect(params.onResponse).toHaveBeenCalledWith(response, dataRequest);
  });
});

describe("AjaxDataSourceResponse", function() {
  it("should load json", function() {
    let jsonPayload = {foo: "bar"};
    let fakeXhr = {
      getResponseHeader: () => "application/json; content-type=utf-8",
      responseText: JSON.stringify(jsonPayload)
    };
    let source = new AjaxDataSourceResponse(fakeXhr);
    expect(source.xhr).toBe(fakeXhr);
    expect(source.json).toEqual(jsonPayload);
  });
  it("should parse Link headers", function() {
    let header = 'Link: <https://api.github.com/user/repos?page=3&per_page=100>; rel="next",' +
      ' <https://api.github.com/user/repos?page=50&per_page=100>; rel="last"';
    let fakeXhr = {getResponseHeader() {}};

    let source = new AjaxDataSourceResponse(fakeXhr);
    spyOn(fakeXhr, 'getResponseHeader').and.returnValue(header);
    source.getUrlParamFromLinkHeader("page", "next");
    expect(fakeXhr.getResponseHeader.calls.count()).toEqual(1);
    expect(fakeXhr.getResponseHeader.calls.argsFor(0)).toEqual(['Link']);

    expect(source.getUrlParamFromLinkHeader("page", "next")).toEqual("3");
    expect(source.getUrlParamFromLinkHeader("page", "last")).toEqual("50");
    expect(source.getUrlParamFromLinkHeader("page", "foo")).toEqual(null);
    expect(source.getUrlParamFromLinkHeader("per_page", "next")).toEqual("100");
  });
});

let UI = {
  // TODO https://www.npmjs.com/package/jasmine-react ?
  create(props, qs="") {
    props.dataUrl = props.dataUrl || "/api";
    let location = props.dataUrl + qs;
    spyOn(window.DataLoader.prototype, 'getWindowLocation').and.returnValue(location);
    let elem = React.createElement(RTable, props);
    ReactDOM.render(elem, document.getElementById('container'));
  },

  nextPage() {
    let elem = document.querySelector("#container .t-next");
    ReactTestUtils.Simulate.click(elem);
  },

  orderByIndex(index) {
    let elem = document.querySelectorAll("#container thead th")[index];
    ReactTestUtils.Simulate.click(elem);
  },

  filterByIndex(inputSelector, index, value) {
    let elem = document.querySelectorAll('#container thead ' + inputSelector)[index];
    elem.value = value;
    ReactTestUtils.Simulate.input(elem);
  }
};

function rows(n) {
  let x = [];
  for (let i=0; i<n; ++i) {
    x.push({"foo": i});
  }
  return x;
}

class MockPromise {
  constructor() {
    this.callbacks = {onFulfilled: [], onRejected: []};
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled === 'function') {
      this.callbacks.onFulfilled.push(onFulfilled);
    }
    if (typeof onRejected === 'function') {
      this.callbacks.onRejected.push(onRejected);
    }

  }
  // This would normally happen when the stack is exhausted.
  // MockPromise requires the caller to trigger that manually
  resolveNow(value) {
    this.callbacks.onFulfilled.forEach(cb => cb(value));
  }
  rejectNow(reason) {
    this.callbacks.onRejected.forEach(cb => cb(reason));
  }
}
