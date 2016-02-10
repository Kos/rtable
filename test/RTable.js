import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-addons-test-utils';
import expect, { createSpy } from 'expect';
import MockPromise from './MockPromise';

import RTable from '../src/rtable'; //eslint-disable-line no-unused-vars


afterEach(function() {
  expect.restoreSpies();
});

describe("RTable", function() {
  describe("rendering", function() {
    it("should render", function() {
      let promise = new MockPromise();
      let fakeDataSource = {
        get: createSpy().andReturn(promise)
      };
      let component = ReactTestUtils.renderIntoDocument(
        <RTable dataSource={fakeDataSource} />
      );
      component.setState({foo: 123});
      let renderedDOM = ReactDOM.findDOMNode(component);
      expect(renderedDOM.tagName).toEqual("TABLE");
    });
  });
});
