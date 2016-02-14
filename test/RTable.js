import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-addons-test-utils';
import expect from 'expect';
import MockPromise from './MockPromise';

import RTable, { deps } from '../src/rtable'; //eslint-disable-line no-unused-vars

afterEach(function() {
  expect.restoreSpies();
});

describe("RTable", function() {

  beforeEach(function() {
    this.dataSource = new FakeDataSource();
    this.renderWithData = function({props, results}) {
      return this.renderWithResponse({props: props, response: {
        'count': results.length, 'next': null, 'previous': null,
        'results': results}});
    };
    this.renderWithResponse = function({props, response}) {
      props.dataSource = this.dataSource;
      let rtable = ReactTestUtils.renderIntoDocument(<RTable {...props} /> );
      props.dataSource.resolve(response);
      return rtable;
    };
    this._window = deps.window;
    deps.window = {
      location: {
        href: "http://example.com/rtable/"
      }
    };
    this.setLocation = loc => {
      deps.window.location.href = loc;
    };
  });

  afterEach(function() {
    deps.window = this._window;
  });

  describe("behaviour", function() {
    it("should download initial data", function() {
      let component = ReactTestUtils.renderIntoDocument(
        <RTable dataSource={this.dataSource} />);
      let lastDataRequest = this.dataSource.lastDataRequest;
      // expect(lastDataRequest).toEqual({
      //   page: 1,
      //   ordering: null,
      //   filters: {}
      // });
      // ... yeah, I wish
      expect(lastDataRequest.page).toEqual(1);
      expect(lastDataRequest.ordering).toEqual(null);
      expect(lastDataRequest.filters).toEqual({});
      this.dataSource.resolve({
        count: 5,
        next: null,
        previous: null,
        results: [5, 4, 3, 2, 1]
      });
      expect(component.state.count).toEqual(5);
      expect(component.state.hasNext).toEqual(false);
    });

    it("should report errors with invalid response");

    it("should take initial request data from window url", function() {
      this.setLocation('http://example.com/?filter1=10&ordering=quux&page=5');
      let filters = [
        {name: 'filter1'},
        {name: 'filter2'}
      ];
      ReactTestUtils.renderIntoDocument(
        <RTable dataSource={this.dataSource} filters={filters}/>);
      let lastDataRequest = this.dataSource.lastDataRequest;
      // expect(lastDataRequest).toEqual({
      //   page: 5,
      //   ordering: "quux",
      //   filters: {
      //     filter1: "10",
      //   }
      // });
      // ... yeah, I wish... again
      expect(lastDataRequest.page).toEqual('5');
      expect(lastDataRequest.ordering).toEqual("quux");
      expect(lastDataRequest.filters).toEqual({filter1: "10"});
    });
    // Once the table renders, the initial request should contain the URL's state

    it("should fetch next page", function() {
      let component = this.renderWithResponse({
        props: {},
        response: {
          count: 10,
          next: "xxx",
          previous: "yyy",
          results: []
        }
      });
      // TODO drop the default page 1. It should be null or something.
      expect(this.dataSource.dataRequests[0].page).toEqual(1);
      let elem = component.refs.paginationNext;
      ReactTestUtils.Simulate.click(elem);
      expect(this.dataSource.dataRequests.length).toEqual(2);
      expect(this.dataSource.lastDataRequest.page).toEqual("xxx");
      expect(this.dataSource.lastDataRequest.ordering).toEqual(null);
      expect(this.dataSource.lastDataRequest.filters).toEqual({});
    });

    it("should sort");
    // Clicking a column should trigger a new request (x2)

    it("should filter selects immediately");
    // Clicking a filter should trigger a new request

    it("should filter selects with value=null");
    // Clicking a filter should trigger a new request

    it("should filter inputs with a delay");
    // Clicking a filter should trigger a new request LATER
  });


  describe("rendering", function() {

    it("should render", function() {
      let component = this.renderWithData({
        props: {}, results: []
      });
      let renderedDOM = ReactDOM.findDOMNode(component);
      expect(renderedDOM.tagName).toEqual("TABLE");
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
      this.setLocation("http://example.com/?ordering=-foo");
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
      this.setLocation("/?filter1=f1value&filter2=f2value");
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
      this.setLocation("http://example.com/?unrelated=bar");
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

class FakeDataSource {
  constructor() {
    this.promise = new MockPromise();
    this.dataRequests = [];
  }
  get(dataRequest) {
    this.dataRequests.push(dataRequest);
    this.lastDataRequest = dataRequest;
    return this.promise;
  }
  resolve(data) {
    this.promise.resolveNow(data);
  }
}
