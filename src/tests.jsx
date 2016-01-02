/* global React, ReactDOM */
/* global RTable */
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

    this.sinon_xhr = sinon.useFakeXMLHttpRequest();
    this.sinon_xhr.onCreate = xhr => this.requests.push(xhr);
    this.requests = [];
  })
  afterEach(function() {
    this.sinon_xhr.restore();
  })
  describe("interactivity", function() {
    it("should download initial data", function() {
      UI.create({});
      expect(this.requests[0].method).toEqual('GET');
      expect(this.requests[0].url).toEqual('/api?page=1'); // drop 1?
    });
    it("should take data from window url", function() {
      UI.create({}, "?page=3&foo=bar");
      expect(this.requests[0].method).toEqual('GET');
      expect(this.requests[0].url).toEqual('/api?page=3&foo=bar'); // ?
    });
    it("should paginate", function(done) {
      UI.create({"columns": [{"name": "foo"}]});
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond(200, {}, JSON.stringify({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      }));
      // HACK: wait for `.respond()`'s promise to resolve... there HAS to be a better way
      setTimeout(() => {
        UI.nextPage();
        // HACK: wait for new Promise() in getJson() to actually fire the request... deja vu
        setTimeout(() => {
          expect(this.requests[1].url).toEqual('/api?page=2');
          done();
        }, 1);
      }, 1);
    });
    it("should sort", function(done) {
      UI.create({"columns": [{"name": "foo", "label": "Foo"}]});
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond(200, {}, JSON.stringify({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      }));
      // HACK: wait for `.respond()`'s promise to resolve
      setTimeout(() => {
        UI.orderByIndex(0);
        setTimeout(() => {
          // HACK: wait for new Promise() in getJson() to actually fire the request... deja vu
          expect(this.requests[1].url).toEqual('/api?page=1&ordering=foo');
          this.requests[1].respond(200, {}, JSON.stringify({
            count: 10, next: "/api?page=2&ordering=foo", previous: null, results: rows(5)
          }));
          setTimeout(() => {
            UI.orderByIndex(0);
            setTimeout(() => {
              expect(this.requests[2].url).toEqual('/api?page=1&ordering=-foo');
              done();
            }, 1);
          }, 1);
        }, 1);
      });

    });
    it("should filter selects immediately");
    it("should filter inputs with a delay");
  });
  describe("rendering", function() {

  });
})

let UI = {
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
  }
};

function rows(n) {
  let x = [];
  for (let i=0; i<n; ++i) {
    x.push({"foo": i});
  }
  return x;
}
