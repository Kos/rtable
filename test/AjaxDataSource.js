import { AjaxDataSourceResponse } from '../src/AjaxDataSource';
import expect from 'expect';
import sinon from 'sinon';


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
    // spyOn(fakeXhr, 'getResponseHeader').and.returnValue(header);
    var getResponseHeader = sinon.stub(fakeXhr, 'getResponseHeader').returns(header);

    source.getUrlParamFromLinkHeader("page", "next");
    expect(fakeXhr.getResponseHeader.callCount).toEqual(1);
    expect(fakeXhr.getResponseHeader.firstCall.args).toEqual(['Link']);

    expect(source.getUrlParamFromLinkHeader("page", "next")).toEqual("3");
    expect(source.getUrlParamFromLinkHeader("page", "last")).toEqual("50");
    expect(source.getUrlParamFromLinkHeader("page", "foo")).toEqual(null);
    expect(source.getUrlParamFromLinkHeader("per_page", "next")).toEqual("100");

    getResponseHeader.restore();
  });
});

