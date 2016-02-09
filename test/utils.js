import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-addons-test-utils';
import expect from 'expect';
import expectJSX from 'expect-jsx';
import * as UrlUtils from '../src/UrlUtils.js';

expect.extend(expectJSX);

describe("foo", function() {
  it("should work", function() {
    let a = x => x*x;
    expect(a(2)).toEqual(4);
  });

  it("should load libs", function() {
    expect(UrlUtils.parseUri).toNotBe(undefined);
  });

  it("should react", function() {
    expect(<div><span>123</span></div>).toIncludeJSX(<span>123</span>);
  });

  it("should render with jsdom", function() {
    let foo = ReactTestUtils.renderIntoDocument(
      <h1 className="hi"><span>Hello there</span></h1>
    );
    expect(foo).toExist();
    let node = ReactDOM.findDOMNode(foo);
    expect(node.classList[0]).toEqual("hi");
    expect(node.childNodes[0].tagName).toEqual("SPAN");
    expect(node.textContent).toEqual("Hello there");

  });
});
