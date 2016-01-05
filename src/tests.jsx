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
    this.requests = [];
    spyOn(window, 'getJson').and.callFake(url => {
      const promise = new MockPromise();
      this.requests.push({
        url, promise,
        respond: function(data) { this.promise.resolveNow(data); }
      });
      return promise;
    });
  });

  describe("interactivity", function() {
    beforeEach(function() {
      this.clock = sinon.useFakeTimers();
    });
    afterEach(function() {
      this.clock.restore();
    });

    it("should download initial data", function() {
      UI.create({});
      expect(this.requests[0].url).toEqual('/api?page=1'); // drop 1?
    });
    it("should take data from window url", function() {
      UI.create({}, "?page=3&foo=bar");
      expect(this.requests[0].url).toEqual('/api?page=3&foo=bar'); // ?
    });
    it("should paginate", function() {
      UI.create({"columns": [{"name": "foo"}]});
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      });
      UI.nextPage();
      expect(this.requests[1].url).toEqual('/api?page=2');
    });
    it("should sort", function() {
      UI.create({"columns": [{"name": "foo", "label": "Foo"}]});
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      });
      UI.orderByIndex(0);
      expect(this.requests[1].url).toEqual('/api?page=1&ordering=foo');
      this.requests[1].respond({
        count: 10, next: "/api?page=2&ordering=foo", previous: null, results: rows(5)
      });
      UI.orderByIndex(0);
      expect(this.requests[2].url).toEqual('/api?page=1&ordering=-foo');
    });
    it("should filter selects immediately", function() {
      UI.create({"columns": [{"name": "foo", "label": "Foo"}],
                 "filters": [{"name": "foo", "label": "Foofilter", "choices": [
                   {"label": "---", "value": "choice"},
                   {"label": "ChoiceA", "value": "choice-a"},
                   {"label": "ChoiceB", "value": "choice-b"}
                 ]}]});
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      });
      UI.filterByIndex('select', 0, "choice-b");
      expect(this.requests[1].url).toEqual('/api?page=1&foo=choice-b');
    });
    it("should filter selects with value=null");
    it("should filter inputs with a delay", function() {
      UI.create({"columns": [{"name": "foo", "label": "Foo"}],
                 "filters": [{"name": "baz", "label": "Foofilter"}]});
      expect(this.requests[0].url).toEqual('/api?page=1');
      this.requests[0].respond({
        count: 10, next: "/api?page=2", previous: null, results: rows(5)
      });
      UI.filterByIndex('input', 0, "quux");
      expect(this.requests.length).toEqual(1);
      this.clock.tick(799);
      expect(this.requests.length).toEqual(1);
      this.clock.tick(1);
      expect(this.requests.length).toEqual(2);
      expect(this.requests[1].url).toEqual('/api?page=1&baz=quux');
    });
  });

  describe("rendering", function() {
  });
});

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
  },

  filterByIndex(inputSelector, index, value) {
    let elem = document.querySelectorAll('#container thead ' + inputSelector)[index];
    elem.value = value;
    ReactTestUtils.Simulate.input(elem);
  }
};

function rows(n) {
  let x = [];
  for (let i=0; i<n; ++i) {
    x.push({"foo": i});
  }
  return x;
}

class MockPromise {
  constructor() {
    this.callbacks = {onFulfilled: [], onRejected: []};
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled === 'function') {
      this.callbacks.onFulfilled.push(onFulfilled);
    }
    if (typeof onRejected === 'function') {
      this.callbacks.onRejected.push(onRejected);
    }

  }
  // This would normally happen when the stack is exhausted.
  // MockPromise requires the caller to trigger that manually
  resolveNow(value) {
    this.callbacks.onFulfilled.forEach(cb => cb(value));
  }
  rejectNow(reason) {
    this.callbacks.onRejected.forEach(cb => cb(reason));
  }
}
