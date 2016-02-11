import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-addons-test-utils';
import expect from 'expect';
import MockPromise from './MockPromise';

import RTable from '../src/rtable'; //eslint-disable-line no-unused-vars

afterEach(function() {
  expect.restoreSpies();
});

describe("RTable", function() {
  describe("rendering", function() {

    beforeEach(function() {
      this.renderWithData = function({props, results}) {
        return this.renderWithResponse({props: props, response: {
          'count': results.length, 'next': null, 'previous': null,
          'results': results}});
      };
      this.renderWithResponse = function({props, response}) {
        props.dataSource = new FakeDataSource(response);
        let rtable = ReactTestUtils.renderIntoDocument(<RTable {...props} /> );
        return rtable;
      };
    });

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

  });
});

class FakeDataSource {
  constructor(data) {
    this.data = data;
  }
  get() {
    return MockPromise.resolve(this.data);
  }
}
