import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-addons-test-utils';
import expect from 'expect';
import MockPromise from './MockPromise';
import isEqual from 'is-equal';
import sinon from 'sinon';

import RTable, { deps } from '../src/rtable'; //eslint-disable-line no-unused-vars

expect.extend({
  toLookLike(expected) {
    let allKeys = Array.from(new Set([...Object.keys(this.actual),
                                      ...Object.keys(expected)]));
    try {
      expect.assert(
        allKeys.every(key => (
          key in this.actual && key in expected &&
          isEqual(this.actual[key], expected[key]))),
        'expected %s to look like %s',
        this.actual,
        expected
      );
    } catch (e) {
      e.showDiff = true;
      e.actual = this.actual;
      e.expected = expected;
      throw e;
    }
  }
});


afterEach(function() {
  expect.restoreSpies();
});

describe("RTable", function() {

  beforeEach(function() {
    this.dataSource = new FakeDataSource();
    this.renderWithResults = function({props, results}) {
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
    this.clock = sinon.useFakeTimers();

  });

  afterEach(function() {
    deps.window = this._window;
    this.clock.restore();
  });

  describe("behaviour", function() {
    it("should download initial data", function() {
      let component = ReactTestUtils.renderIntoDocument(
        <RTable dataSource={this.dataSource} />);
      expect(this.dataSource.lastDataRequest).toLookLike({
        page: 1,
        ordering: null,
        filters: {}
      });
      this.dataSource.resolve({
        count: 5,
        next: null,
        previous: null,
        results: [5, 4, 3, 2, 1]
      });
      expect(component.state.count).toEqual(5);
      expect(component.state.hasNextPage).toEqual(false);
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
      expect(this.dataSource.lastDataRequest).toLookLike({
        page: "5",
        ordering: "quux",
        filters: {
          filter1: "10"
        }
      });
    });

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
      expect(this.dataSource.lastDataRequest).toLookLike({
        page: 1,
        ordering: null,
        filters: {}
      });
      let elem = component.refs.paginationNext;
      ReactTestUtils.Simulate.click(elem);
      expect(this.dataSource.dataRequests.length).toEqual(2);
      expect(this.dataSource.lastDataRequest).toLookLike({
        page: "xxx",
        ordering: null,
        filters: {}
      });
    });

    it("should perform ordering when a column is clicked", function() {
      let component = this.renderWithResults({
        props: {
          ordering: "all",
          columns: [{name: "foo"}]
        },
        results: []
      });
      expect(this.dataSource.lastDataRequest).toLookLike({
        page: 1,
        ordering: null,
        filters: {}
      });
      let elem = component.refs.columnHeaderRow.children[0];
      ReactTestUtils.Simulate.click(elem);
      expect(this.dataSource.dataRequests.length).toEqual(2);
      expect(this.dataSource.lastDataRequest).toLookLike({
        page: 1,
        ordering: "foo",
        filters: {}
      });
      this.dataSource.resolve({count: 0, next: null, previous: null, results: []});
      ReactTestUtils.Simulate.click(elem);
      expect(this.dataSource.dataRequests.length).toEqual(3);
      expect(this.dataSource.lastDataRequest).toLookLike({
        page: 1,
        ordering: "-foo",
        filters: {}
      });
    });

    it("should filter selects (immediately)", function() {
      let component = this.renderWithResults({
        props: {
          filters: [{"name": "foo", "choices": [null, "one", "two"]}]
        },
        results: []
      });
      let elem = component.refs.filterContainer.querySelector('select');
      elem.value = "one";
      ReactTestUtils.Simulate.input(elem);
      expect(this.dataSource.dataRequests.length).toEqual(2);
      expect(this.dataSource.lastDataRequest).toLookLike({
        page: 1,
        ordering: null,
        filters: {
          foo: "one"
        }
      });
      this.dataSource.resolve({count: 0, next: null, previous: null, results: []});
      elem.value = null;
      ReactTestUtils.Simulate.input(elem);
      expect(this.dataSource.dataRequests.length).toEqual(3);
      expect(this.dataSource.lastDataRequest).toLookLike({
        page: 1,
        ordering: null,
        filters: {}
      });
    });

    it("should filter inputs with a delay", function() {
      let component = this.renderWithResults({
        props: {
          filters: [{"name": "foo"}]
        },
        results: []
      });
      let elem = component.refs.filterContainer.querySelector('input');
      elem.value = "ding";
      ReactTestUtils.Simulate.input(elem);
      expect(this.dataSource.dataRequests.length).toEqual(1);
      this.clock.tick(component.loader.filterDelay-1);
      expect(this.dataSource.dataRequests.length).toEqual(1);
      this.clock.tick(1);
      expect(this.dataSource.dataRequests.length).toEqual(2);
      expect(this.dataSource.lastDataRequest).toLookLike({
        page: 1,
        ordering: null,
        filters: {
          foo: "ding"
        }
      });
    });
  });


  describe("rendering", function() {

    it("should render", function() {
      let component = this.renderWithResults({
        props: {}, results: []
      });
      let renderedDOM = ReactDOM.findDOMNode(component);
      expect(renderedDOM.tagName).toEqual("TABLE");
    });

    it("should render row values", function() {
      let rtable = this.renderWithResults({
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
      let rtable = this.renderWithResults({
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
      let rtable = this.renderWithResults({
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
      expectClasses(rtable.refs.filterContainer).toEqual(['form-inline']);
      expectClasses(rtable.refs.filterContainer.querySelector('input')).toEqual(['form-control', 'input-sm']);
      expectClasses(rtable.refs.filterContainer.querySelector('select')).toEqual(['form-control', 'input-sm']);
      expectClasses(rtable.refs.rowContainer).toEqual([]);
      // TODO drop t-next, t-prev
      expectClasses(rtable.refs.paginationNext).toEqual(['btn', 'btn-primary', 't-next']);
      expectClasses(rtable.refs.paginationPrevious).toEqual(['btn', 'btn-primary', 't-prev']);
    });

    it("should render initial ordering", function() {
      this.setLocation("http://example.com/?ordering=-foo");
      let rtable = this.renderWithResults({
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
      let rtable = this.renderWithResults({
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
      let input = rtable.refs.filterContainer.querySelector("input");
      let select = rtable.refs.filterContainer.querySelector("select");
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
  resolve(dataResponse) {
    this.promise.resolveNow(dataResponse);
  }
}
