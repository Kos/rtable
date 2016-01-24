"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* global React */

var RTable = (function (_React$Component) {
  _inherits(RTable, _React$Component);

  function RTable(props) {
    _classCallCheck(this, RTable);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(RTable).call(this, props));

    _this.state = {
      results: []
    };
    var dataSource = new DefaultDataSource(_this.props.dataUrl);
    _this.loader = new RTable.DataLoader(_this, dataSource);
    return _this;
  }

  _createClass(RTable, [{
    key: "componentWillMount",
    value: function componentWillMount() {
      this.loader.loadInitial();
    }
  }, {
    key: "getValue",
    value: function getValue(row, col) {
      if (col.get) {
        return col.get(row);
      }
      return row[col.name];
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var filters = this.props.filters || [];
      var columns = this.props.columns || [];
      var header = columns.map(function (col, n) {
        return React.createElement(
          "th",
          { key: n, onClick: _this2.loader.fn.orderToggle(col.name) },
          col.label || col.name,
          _this2.state.ordering == col.name ? "▲" : _this2.state.ordering == "-" + col.name ? "▼" : null
        );
      });
      var rows = this.state.results.map(function (row, m) {
        var cells = _this2.props.columns.map(function (col, n) {
          return React.createElement(
            "td",
            { key: n },
            _this2.getValue(row, col)
          );
        });
        return React.createElement(
          "tr",
          { key: m },
          cells
        );
      });

      return React.createElement(
        "table",
        { className: "table table-striped table-hover" },
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement(
              "td",
              { ref: "paginationContainer", className: "text-center", colSpan: columns.length },
              this.state.hasPrev ? React.createElement(
                "a",
                { ref: "paginationPrevious", className: "btn btn-primary t-prev", href: this.state.prevQuery, onClick: this.loader.fn.prevPage },
                "prev"
              ) : React.createElement(
                "button",
                { ref: "paginationPrevious", className: "btn btn-primary t-prev", disabled: true },
                "prev"
              ),
              ' ',
              "page ",
              this.state.page,
              " of ",
              this.state.pages,
              ", results ",
              this.state.firstResult,
              "-",
              this.state.lastResult,
              " of ",
              this.state.count,
              ' ',
              this.state.hasNext ? React.createElement(
                "a",
                { ref: "paginationNext", className: "btn btn-primary t-next", href: this.state.nextQuery, onClick: this.loader.fn.nextPage },
                "next"
              ) : React.createElement(
                "button",
                { ref: "paginationNext", className: "btn btn-primary t-next", disabled: true },
                "next"
              )
            )
          ),
          React.createElement(
            "tr",
            { ref: "filterRow" },
            React.createElement(
              "td",
              { className: "form-inline", colSpan: columns.length },
              filters.map(function (filter, i) {
                return React.createElement(
                  "span",
                  { key: i },
                  React.createElement(
                    "label",
                    null,
                    filter.label + ':'
                  ),
                  ' ',
                  filter.choices ? React.createElement(
                    "select",
                    { className: "form-control input-sm ", onInput: _this2.loader.fn.filter(filter.name), defaultValue: _this2.state.initialFilterState[filter.name] },
                    filter.choices.map(function (choice, j) {
                      return React.createElement(
                        "option",
                        { key: j, value: choice.value },
                        choice.label || choice.value
                      );
                    })
                  ) : React.createElement("input", { className: "form-control input-sm", onInput: _this2.loader.fn.filterDelayed(filter.name), defaultValue: _this2.state.initialFilterState[filter.name] }),
                  ' '
                );
              })
            )
          ),
          React.createElement(
            "tr",
            { ref: "columnHeaderRow" },
            header
          )
        ),
        React.createElement(
          "tbody",
          { ref: "rowContainer" },
          rows
        )
      );
    }
  }]);

  return RTable;
})(React.Component);

var DataLoader = (function () {
  function DataLoader(component, dataSource) {
    var _this3 = this;

    _classCallCheck(this, DataLoader);

    this.component = component;
    this.dataSource = dataSource;
    this.filterDelay = 800;
    this.fn = {
      goToPage: this.goToPage.bind(this),
      nextPage: this.nextPage.bind(this),
      prevPage: this.prevPage.bind(this),
      orderBy: function orderBy(column) {
        return function (event) {
          return _this3.orderBy(event, column);
        };
      },
      orderToggle: function orderToggle(column) {
        return function (event) {
          return _this3.orderToggle(event, column);
        };
      },
      filter: function filter(key) {
        return function (event) {
          return _this3.filter(event, key);
        };
      },
      filterDelayed: function filterDelayed(key) {
        return delayed(_this3.filterDelay, function (event) {
          return _this3.filter(event, key);
        });
      }
    };
  }

  _createClass(DataLoader, [{
    key: "loadInitial",
    value: function loadInitial() {
      var data = parseUri(this.getWindowLocation()).queryKey;
      // TODO only read stuff that you understand, don't just take the whole window's QS
      var initialFilterState = data;
      this.component.setState({
        initialFilterState: initialFilterState
      });
      var initialDataRequest = {
        "page": data.page || 1,
        "ordering": data.ordering || null,
        "filters": initialFilterState
      };
      this.loadFromSource(initialDataRequest);
    }
  }, {
    key: "getWindowLocation",
    value: function getWindowLocation() {
      return window.location;
    }
  }, {
    key: "currentState",
    value: function currentState() {
      return this.component.state;
    }
  }, {
    key: "loadWithUpdatedParams",
    value: function loadWithUpdatedParams(newParams) {
      var state = this.currentState();
      var newDataRequest = Object.assign({}, state, newParams);
      newDataRequest.filters = Object.assign({}, state.filters, newParams.filters || {});
      // TODO window history
      // if (window.history.replaceState) {
      // window.history.replaceState({}, '', newWindowUrl);
      // }
      return this.loadFromSource(newDataRequest);
    }
  }, {
    key: "loadFromSource",
    value: function loadFromSource(dataRequest) {
      var _this4 = this;

      return this.dataSource.get(dataRequest).then(function (response) {
        var state = _this4.buildStateFromResponse(response, dataRequest);
        _this4.component.setState(state);
        return state;
      });
    }
  }, {
    key: "goToPage",
    value: function goToPage(event, page) {
      if (event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      return this.loadWithUpdatedParams({ page: page });
    }
  }, {
    key: "nextPage",
    value: function nextPage(event) {
      return this.goToPage(event, this.currentState().page + 1);
    }
  }, {
    key: "prevPage",
    value: function prevPage(event) {
      return this.goToPage(event, this.currentState().page - 1);
    }
  }, {
    key: "orderBy",
    value: function orderBy(event, ordering) {
      if (event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      return this.loadWithUpdatedParams({ ordering: ordering });
    }
  }, {
    key: "orderToggle",
    value: function orderToggle(event, ordering) {
      if (!ordering.length) {
        return;
      }
      if (this.currentState().ordering == ordering) {
        if (ordering[0] == '-') {
          ordering = ordering.substr(1);
        } else {
          ordering = '-' + ordering;
        }
      }
      return this.orderBy(event, ordering);
    }
  }, {
    key: "filter",
    value: function filter(event, key) {
      var newFilterValue = event.target.value || null;
      return this.loadWithUpdatedParams({ filters: _defineProperty({}, key, newFilterValue) });
    }
  }, {
    key: "buildStateFromResponse",
    value: function buildStateFromResponse(dataResponse, dataRequest) {
      var divideRoundUp = function divideRoundUp(a, b) {
        return Math.floor((a + b - 1) / b);
      };
      // TODO page ids should be opaque here.
      // don't special case 1, have the source support page null?
      // (UI support needed too)
      var page = parseInt(dataRequest.page) || 1;
      var page0 = page - 1;
      var state = {
        count: dataResponse.count,
        next: dataResponse.next,
        previous: dataResponse.previous,
        results: dataResponse.results,
        page: page,
        page0: page - 1,
        hasNext: !!dataResponse.next,
        hasPrev: !!dataResponse.previous,
        // TODO build them from page ids
        nextQuery: "TODO",
        prevQuery: "TODO",
        ordering: dataRequest.ordering || null
      };
      if (dataResponse.next) {
        var pageSize = dataResponse.results.length;
        state.pages = divideRoundUp(dataResponse.count, pageSize);
        state.firstResult = pageSize * page0 + 1;
        state.lastResult = pageSize * (page0 + 1);
      } else {
        state.pages = page;
        state.lastResult = dataResponse.count;
        state.firstResult = dataResponse.count - dataResponse.results.length + 1;
      }
      return state;
    }
  }]);

  return DataLoader;
})();

var DefaultDataSource = (function () {
  function DefaultDataSource(baseUrl) {
    _classCallCheck(this, DefaultDataSource);

    this.baseUrl = baseUrl;
  }

  _createClass(DefaultDataSource, [{
    key: "get",
    value: function get(dataRequest) {
      var url = this.baseUrl;
      url = updateQueryStringMultiple({
        page: dataRequest.page,
        ordering: dataRequest.ordering
      }, url);
      url = updateQueryStringMultiple(dataRequest.filters, url);
      return getJson(url);
    }
  }]);

  return DefaultDataSource;
})();

RTable.DataLoader = DataLoader;

function getJson(url) {
  var request = new XMLHttpRequest();
  return new Promise(function (resolve, reject) {
    request.open('GET', url, true);
    request.onreadystatechange = function () {
      if (this.readyState !== 4) {
        return;
      }
      if (this.status >= 200 && this.status < 400) {
        try {
          resolve(JSON.parse(this.responseText));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(this);
      }
    };
    request.send();
  });
}

function delayed(delay, fn) {
  var timeout = null;
  return function () {
    var _arguments = arguments;

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function () {
      return fn.apply(null, _arguments);
    }, delay);
  };
}

/* ------------- */
/* packaged deps */

// http://blog.stevenlevithan.com/archives/parseuri
function parseUri(str) {
  var o = parseUri.options,
      m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
      uri = {},
      i = 14;

  while (i--) {
    uri[o.key[i]] = m[i] || "";
  }uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
}

parseUri.options = {
  strictMode: false,
  key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
  q: {
    name: "queryKey",
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};

// http://stackoverflow.com/a/11654596/399317
function updateQueryString(key, value, url) {
  var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi");
  var hash;

  if (re.test(url)) {
    if (typeof value !== 'undefined' && value !== null) return url.replace(re, '$1' + key + "=" + value + '$2$3');else {
      hash = url.split('#');
      url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
      if (typeof hash[1] !== 'undefined' && hash[1] !== null) url += '#' + hash[1];
      return url;
    }
  } else {
    if (typeof value !== 'undefined' && value !== null) {
      var separator = url.indexOf('?') !== -1 ? '&' : '?';
      hash = url.split('#');
      url = hash[0] + separator + key + '=' + value;
      if (typeof hash[1] !== 'undefined' && hash[1] !== null) url += '#' + hash[1];
      return url;
    } else return url;
  }
}

function updateQueryStringMultiple(obj, url) {
  Object.keys(obj).forEach(function (key) {
    url = updateQueryString(key, obj[key], url);
  });
  return url;
}
