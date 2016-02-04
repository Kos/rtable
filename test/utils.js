import React from 'react'; // eslint-disable-line no-unused-vars
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
});
