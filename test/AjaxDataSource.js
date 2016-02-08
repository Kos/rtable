import { AjaxDataSource, deps, AjaxDataSourceResponse } from '../src/AjaxDataSource';
import MockPromise from './MockPromise';
import expect, { createSpy, spyOn } from 'expect';

afterEach(function () {
  expect.restoreSpies();
});


describe("AjaxDataSource", function() {
  it("should GET baseUrl and call onResponse", function() {
    let params = {
      baseUrl: "http://example.com/foo",
      onResponse: createSpy()
    };
    let dataRequest = {
      'page': 1,
      'ordering' : '-quux',
      'filters': {'foo': 'bar'},
      'flatten': () => ({'page': 1, 'ordering': '-quux', 'foo': 'bar'})
    };
    let ajaxGetPromise = new MockPromise();
    let ajaxGet = spyOn(deps, 'ajaxGet').andReturn(ajaxGetPromise);
    new AjaxDataSource(params).get(dataRequest);
    expect(ajaxGet).toHaveBeenCalledWith(
      "http://example.com/foo?page=1&ordering=-quux&foo=bar");

    let response = {};
    let AjaxDataSourceResponse = spyOn(deps, 'AjaxDataSourceResponse')
      .andReturn(response);
    ajaxGetPromise.resolveNow('xhr');
    expect(AjaxDataSourceResponse).toHaveBeenCalledWith('xhr');
    expect(params.onResponse).toHaveBeenCalledWith(response, dataRequest);
  });
});


describe("AjaxDataSourceResponse", function () {
  it("should load json", function () {
    var jsonPayload = { foo: "bar" };
    var fakeXhr = {
      getResponseHeader: function getResponseHeader() {
        return "application/json; content-type=utf-8";
      },
      responseText: JSON.stringify(jsonPayload)
    };
    var source = new AjaxDataSourceResponse(fakeXhr);
    expect(source.xhr).toBe(fakeXhr);
    expect(source.json).toEqual(jsonPayload);
  });
  it("should parse Link headers", function () {
    var header = 'Link: <https://api.github.com/user/repos?page=3&per_page=100>; rel="next",' + ' <https://api.github.com/user/repos?page=50&per_page=100>; rel="last"';
    var fakeXhr = {
      getResponseHeader: function getResponseHeader() {}
    };

    var source = new AjaxDataSourceResponse(fakeXhr);
    spyOn(fakeXhr, 'getResponseHeader').andReturn(header);

    source.getUrlParamFromLinkHeader("page", "next");
    expect(fakeXhr.getResponseHeader).toHaveBeenCalledWith('Link');

    expect(source.getUrlParamFromLinkHeader("page", "next")).toEqual("3");
    expect(source.getUrlParamFromLinkHeader("page", "last")).toEqual("50");
    expect(source.getUrlParamFromLinkHeader("page", "foo")).toEqual(null);
    expect(source.getUrlParamFromLinkHeader("per_page", "next")).toEqual("100");
  });
});
