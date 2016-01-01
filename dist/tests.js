'use strict';

/* global React, ReactDOM */
/* global RTable */
/* global sinon */

var ReactTestUtils = React.addons.TestUtils;

describe("RTable", function () {
  beforeEach(function () {
    var _this = this;

    var d = document.getElementById('container');
    if (d) {
      d.parentNode.removeChild(d);
    }
    d = document.createElement('div');
    d.id = 'container';
    document.body.insertBefore(d, document.body.children[0]);

    this.sinon_xhr = sinon.useFakeXMLHttpRequest();
    this.sinon_xhr.onCreate = function (xhr) {
      return _this.requests.push(xhr);
    };
    this.requests = [];
  });
  afterEach(function () {
    this.sinon_xhr.restore();
  });
  describe("interactivity", function () {
    it("should download initial data", function () {
      UI.create({});
      expect(this.requests[0].method).toEqual('GET');
      expect(this.requests[0].url).toEqual('/api?page=1'); // drop 1?
    });
    it("should take data from window url", function () {
      UI.create({}, "?page=3&foo=bar");
      expect(this.requests[0].method).toEqual('GET');
      expect(this.requests[0].url).toEqual('/api?page=3&foo=bar'); // ?
    });
    it("should paginate", function (done) {
      var _this2 = this;

      UI.create({ "columns": [{ "name": "foo" }] });
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond(200, {}, JSON.stringify({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      }));
      // HACK: wait for `.respond()`'s promise to resolve... there HAS to be a better way
      setTimeout(function () {
        UI.nextPage();
        // HACK: wait for new Promise() in getJson() to actually fire the request... deja vu
        setTimeout(function () {
          expect(_this2.requests[1].url).toEqual('/api?page=2');
          done();
        }, 1);
      }, 1);
    });
    it("should sort");
    it("should filter selects immediately");
    it("should filter inputs with a delay");
  });
  describe("rendering", function () {});
});

var UI = {
  create: function create(props) {
    var qs = arguments.length <= 1 || arguments[1] === undefined ? "" : arguments[1];

    props.dataUrl = props.dataUrl || "/api";
    var location = props.dataUrl + qs;
    spyOn(window.DataLoader.prototype, 'getWindowLocation').and.returnValue(location);
    var elem = React.createElement(RTable, props);
    ReactDOM.render(elem, document.getElementById('container'));
  },
  nextPage: function nextPage() {
    var elem = document.querySelector("#container .t-next");
    ReactTestUtils.Simulate.click(elem);
  }
};

function rows(n) {
  var x = [];
  for (var i = 0; i < n; ++i) {
    x.push({ "foo": i });
  }
  return x;
}