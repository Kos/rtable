import React from 'react';

var babelHelpers = {};
babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

babelHelpers.defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

babelHelpers.extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

babelHelpers.inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

babelHelpers.possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

babelHelpers.toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

babelHelpers;

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

function isNullOrUndefined(x) {
  return x == null; // eslint-disable-line eqeqeq
}

var AjaxDataSource = function () {
  function AjaxDataSource(_ref) {
    var baseUrl = _ref.baseUrl;
    var onResponse = _ref.onResponse;
    babelHelpers.classCallCheck(this, AjaxDataSource);

    this.baseUrl = baseUrl;
    this.onResponse = onResponse;
  }

  babelHelpers.createClass(AjaxDataSource, [{
    key: 'get',
    value: function get(dataRequest) {
      var _this = this;

      var url = updateQueryStringMultiple(dataRequest.flatten(), this.baseUrl);
      return deps$1.ajaxGet(url).then(function (xhr) {
        return _this.onResponse(new deps$1.AjaxDataSourceResponse(xhr), dataRequest);
      });
    }
  }]);
  return AjaxDataSource;
}();

var AjaxDataSourceResponse = function () {
  function AjaxDataSourceResponse(xhr) {
    babelHelpers.classCallCheck(this, AjaxDataSourceResponse);

    this.xhr = xhr;
    this.json = this._tryLoadJson();
  }

  babelHelpers.createClass(AjaxDataSourceResponse, [{
    key: 'getUrlParamFromLinkHeader',
    value: function getUrlParamFromLinkHeader(param, rel) {
      var header = this.xhr.getResponseHeader('Link');
      var linkRegex = /<([^>]+)>; rel="(\w+)"/g;
      for (var groups; groups = linkRegex.exec(header);) {
        var thisURL = groups[1];
        var thisRel = groups[2];
        if (thisRel === rel) {
          return this.getUrlParamFromURL(param, thisURL);
        }
      }
      return null;
    }
  }, {
    key: 'getUrlParamFromURL',
    value: function getUrlParamFromURL(param, url) {
      return parseUri(url).queryKey[param];
    }
  }, {
    key: '_tryLoadJson',
    value: function _tryLoadJson() {
      var ct = this.xhr.getResponseHeader('content-type');
      if (!ct) return null;
      ct = ct.toLowerCase();
      ct = ct.split(";")[0].trim(); // ; charset=...
      if (ct !== 'application/json') return null;
      try {
        return JSON.parse(this.xhr.responseText);
      } catch (e) {
        return null;
      }
    }
  }]);
  return AjaxDataSourceResponse;
}();

var DefaultDataSource = function () {
  // TODO implement on top of AjaxDataSource

  function DefaultDataSource(baseUrl) {
    babelHelpers.classCallCheck(this, DefaultDataSource);

    this.baseUrl = baseUrl;
    // TODO this is a good place to allow to override how 'page' and 'ordering'
    // params are passed to the backend.
  }

  babelHelpers.createClass(DefaultDataSource, [{
    key: 'get',
    value: function get(dataRequest) {
      var url = this.baseUrl;
      url = updateQueryStringMultiple(dataRequest.flatten(), url);
      return getJson(url).then(function (dataResponse) {
        if (!isNullOrUndefined(dataResponse.next)) {
          dataResponse.next = parseUri(dataResponse.next).queryKey.page;
        }
        if (!isNullOrUndefined(dataResponse.previous)) {
          // HACK: if there's a previous URL but the page param itself is missing,
          // default to 1. DRF likes to drop the ?page=1
          dataResponse.previous = parseUri(dataResponse.previous).queryKey.page || 1;
        }
        return dataResponse;
      });
    }
  }]);
  return DefaultDataSource;
}();

function getJson(url) {
  return deps$1.ajaxGet(url, 'json');
}

function ajaxGet(url) {
  var res = arguments.length <= 1 || arguments[1] === undefined ? 'xhr' : arguments[1];

  var request = new XMLHttpRequest();
  return new Promise(function (resolve, reject) {
    request.open('GET', url, true);
    request.onreadystatechange = function () {
      if (this.readyState !== 4) {
        return;
      }
      if (this.status >= 200 && this.status < 400) {
        try {
          if (res === 'json') {
            // TODO drop res, handle json in caller
            resolve(JSON.parse(this.responseText), this);
          } else {
            resolve(this);
          }
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

var deps$1 = {
  ajaxGet: ajaxGet,
  AjaxDataSourceResponse: AjaxDataSourceResponse
};

var deps = {
  window: window
};

var RTable = function (_React$Component) {
  babelHelpers.inherits(RTable, _React$Component);

  function RTable(props) {
    babelHelpers.classCallCheck(this, RTable);

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RTable).call(this, props));

    _this.state = {
      results: []
    };
    var dataSource = _this.props.dataSource || new DefaultDataSource(_this.props.dataUrl);
    _this.loader = new DataLoader(_this, dataSource);
    return _this;
  }

  babelHelpers.createClass(RTable, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.loader.loadInitial();
    }
  }, {
    key: 'getValue',
    value: function getValue(row, col) {
      if (col.get) {
        return col.get(row);
      }
      return row[col.name];
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var filters = this.props.filters || [];
      var columns = this.props.columns || [];
      var ordering = this.props.ordering || [];
      var isOrderable = function isOrderable(colName) {
        return ordering === "all" || ordering.some(function (x) {
          return x === colName;
        });
      };
      var header = columns.map(function (col, n) {
        return React.createElement(
          'th',
          { key: n, onClick: isOrderable(col.name) ? _this2.loader.fn.orderToggle(col.name) : null },
          col.label || col.name,
          _this2.state.ordering === col.name ? '▲' : _this2.state.ordering === "-" + col.name ? '▼' : null
        );
      });
      var rows = this.state.results.map(function (row, m) {
        var values = columns.map(function (col) {
          return _this2.getValue(row, col);
        });
        return React.createElement(Item, { key: m, data: row, values: values });
      });
      return React.createElement(
        'table',
        { className: 'table table-striped table-hover', ref: 'table' },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            React.createElement(
              'td',
              { ref: 'paginationContainer', className: 'text-center', colSpan: columns.length },
              React.createElement(Pagination, babelHelpers.extends({ loader: this.loader }, this.state))
            )
          ),
          React.createElement(
            'tr',
            null,
            React.createElement(
              'td',
              { ref: 'filterContainer', className: 'form-inline', colSpan: columns.length },
              filters.map(function (filter, i) {
                return React.createElement(
                  'span',
                  { key: i },
                  React.createElement(
                    'label',
                    null,
                    filter.label + ':'
                  ),
                  ' ',
                  filter.choices ? React.createElement(
                    'select',
                    { className: 'form-control input-sm ', onInput: _this2.loader.fn.filter(filter.name), defaultValue: _this2.state.initialFilterState[filter.name] },
                    filter.choices.map(function (choice, j) {
                      return React.createElement(FilterChoiceOption, { key: j, choice: choice });
                    })
                  ) : React.createElement('input', { className: 'form-control input-sm', onInput: _this2.loader.fn.filterDelayed(filter.name), defaultValue: _this2.state.initialFilterState[filter.name] }),
                  ' '
                );
              })
            )
          ),
          React.createElement(
            'tr',
            { ref: 'columnHeaderRow' },
            header
          )
        ),
        React.createElement(
          'tbody',
          { ref: 'rowContainer' },
          rows
        )
      );
    }
  }, {
    key: 'find',
    value: function find(cls) {
      return this.refs.table.querySelector(cls);
    }
  }]);
  return RTable;
}(React.Component);

function Item(props) {
  // eslint-disable-line no-unused-vars
  var cells = props.values.map(function (col, n) {
    return React.createElement(
      'td',
      { key: n },
      col
    );
  });
  return React.createElement(
    'tr',
    null,
    cells
  );
}

function Pagination(props) {
  // eslint-disable-line no-unused-vars
  var paginationInfo = undefined;
  if (props.count === '?') {
    paginationInfo = React.createElement(
      'span',
      null,
      'page ',
      props.page
    );
  } else {
    paginationInfo = React.createElement(
      'span',
      null,
      'page ',
      props.page,
      ' of ',
      props.pages,
      ', results ',
      props.firstResult,
      '-',
      props.lastResult,
      ' of ',
      props.count
    );
  }

  // TODO configurable classes; only add t-next t-prev in tests
  var btn = function btn(text, cls, cond, href, onClick) {
    return cond ? React.createElement(
      'a',
      { className: "btn btn-primary " + cls, href: href, onClick: onClick },
      text
    ) : React.createElement(
      'button',
      { className: "btn btn-primary " + cls, disabled: true },
      text
    );
  };

  return React.createElement(
    'span',
    null,
    btn("prev", "t-prev", props.hasPreviousPage, props.prevQuery, props.loader.fn.prevPage),
    ' ',
    paginationInfo,
    ' ',
    btn("next", "t-next", props.hasNextPage, props.nextQuery, props.loader.fn.nextPage)
  );
}

function FilterChoiceOption(_ref) {
  var choice = _ref.choice;
  // eslint-disable-line no-unused-vars
  if (choice === null) {
    choice = {
      label: "",
      value: null
    };
  } else if ((typeof choice === 'undefined' ? 'undefined' : babelHelpers.typeof(choice)) !== "object") {
    choice = {
      label: choice.toString(),
      value: choice.toString()
    };
  }
  return React.createElement(
    'option',
    { value: choice.value },
    choice.label || choice.value
  );
}

var DataLoader = function () {
  function DataLoader(component, dataSource) {
    var _this3 = this;

    babelHelpers.classCallCheck(this, DataLoader);

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
          return _this3.filter(event.target, key);
        };
      },
      filterDelayed: function filterDelayed(key) {
        return delayed(_this3.filterDelay, function (eventTarget) {
          return _this3.filter(eventTarget, key);
        }, function (event) {
          return [event.target];
        });
      }
    };
  }

  babelHelpers.createClass(DataLoader, [{
    key: 'loadInitial',
    value: function loadInitial() {
      var initialDataRequest = this.decodeWindowUrl();
      this.component.setState({
        initialFilterState: initialDataRequest.filters
      });
      this.loadFromSource(initialDataRequest);
    }
  }, {
    key: 'getWindowLocation',
    value: function getWindowLocation() {
      return deps.window.location.href;
    }
  }, {
    key: 'currentState',
    value: function currentState() {
      return this.component.state;
    }
  }, {
    key: 'loadWithUpdatedParams',
    value: function loadWithUpdatedParams(newParams) {
      var state = this.currentState();
      var clearNulls = function clearNulls(obj) {
        return objectValueFilter(function (x) {
          return !isNullOrUndefined(x);
        }, obj);
      };
      var newDataRequest = new DataRequest({
        page: newParams.page !== undefined ? newParams.page : state.page,
        ordering: newParams.ordering !== undefined ? newParams.ordering : state.ordering,
        filters: clearNulls(Object.assign({}, state.filters, newParams.filters || {}))
      });
      if (deps.window.history && deps.window.history.replaceState) {
        deps.window.history.replaceState({}, '', this.encodeWindowUrl(newDataRequest));
      }
      return this.loadFromSource(newDataRequest);
    }
  }, {
    key: 'encodeWindowUrl',
    value: function encodeWindowUrl(dataRequest) {
      return updateQueryStringMultiple(dataRequest.flatten(), this.getWindowLocation());
    }
  }, {
    key: 'decodeWindowUrl',
    value: function decodeWindowUrl() {
      var data = parseUri(this.getWindowLocation()).queryKey;
      var filters = this.component.props.filters || [];
      var filterExists = function filterExists(name) {
        return filters.some(function (f) {
          return f.name === name;
        });
      };
      var filterState = pick(data, Object.keys(data).filter(filterExists));
      return new DataRequest({
        "page": data.page || 1,
        "ordering": data.ordering || null,
        "filters": filterState
      });
    }
  }, {
    key: 'loadFromSource',
    value: function loadFromSource(dataRequest) {
      var _this4 = this;

      var validateResponse = function validateResponse(resp) {
        validate(function (check) {
          check.object(resp, "resp");
          check.numberOrNull(resp.count, "resp.count");
          check.defined(resp.next, "resp.next");
          check.defined(resp.previous, "resp.previous");
          check.array(resp.results, "resp.results");
        });
        return resp;
      };
      return this.dataSource.get(dataRequest).then(validateResponse).then(function (response) {
        var state = _this4.buildStateFromResponse(response, dataRequest);
        _this4.component.setState(state);
        return state;
      }).catch(this.reportError.bind(this));
    }
  }, {
    key: 'goToPage',
    value: function goToPage(event, page) {
      if (event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      return this.loadWithUpdatedParams({ page: page });
    }
  }, {
    key: 'nextPage',
    value: function nextPage(event) {
      return this.goToPage(event, this.currentState().nextPage);
    }
  }, {
    key: 'prevPage',
    value: function prevPage(event) {
      return this.goToPage(event, this.currentState().previousPage);
    }
  }, {
    key: 'orderBy',
    value: function orderBy(event, ordering) {
      if (event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      return this.loadWithUpdatedParams({ ordering: ordering });
    }
  }, {
    key: 'orderToggle',
    value: function orderToggle(event, ordering) {
      if (!ordering.length) {
        return;
      }
      if (this.currentState().ordering === ordering) {
        if (ordering[0] === '-') {
          ordering = ordering.substr(1);
        } else {
          ordering = '-' + ordering;
        }
      }
      return this.orderBy(event, ordering);
    }
  }, {
    key: 'filter',
    value: function filter(eventTarget, key) {
      // HACK? This takes eventTarget, not Event,
      // since react recycles event objects
      // which make this not work with delayed()
      var newFilterValue = eventTarget.value || null;
      return this.loadWithUpdatedParams({ filters: babelHelpers.defineProperty({}, key, newFilterValue) });
    }
  }, {
    key: 'buildStateFromResponse',
    value: function buildStateFromResponse(dataResponse, dataRequest) {
      var _this5 = this;

      var divideRoundUp = function divideRoundUp(a, b) {
        return Math.floor((a + b - 1) / b);
      };
      var buildPageUrl = function buildPageUrl(page) {
        var nextDR = Object.assign(new DataRequest(dataRequest), { page: page });
        return '?' + parseUri(_this5.encodeWindowUrl(nextDR)).query;
      };
      // TODO page ids should be opaque here.
      // don't special case 1, have the source support page null?
      // (UI support needed too)
      var page = parseInt(dataRequest.page) || 1;
      var page0 = page - 1;
      var haveCount = !isNullOrUndefined(dataResponse.count);
      var state = {
        count: haveCount ? dataResponse.count : '?',
        nextPage: dataResponse.next,
        previousPage: dataResponse.previous,
        results: dataResponse.results,
        page: page,
        page0: page - 1,
        hasNextPage: !!dataResponse.next,
        hasPreviousPage: !!dataResponse.previous,
        nextQuery: buildPageUrl(dataResponse.next),
        prevQuery: buildPageUrl(dataResponse.previous),
        ordering: dataRequest.ordering || null
      };
      if (haveCount) {
        if (dataResponse.next) {
          var pageSize = dataResponse.results.length;
          state.firstResult = pageSize * page0 + 1;
          state.lastResult = pageSize * (page0 + 1);
          state.pages = divideRoundUp(dataResponse.count, pageSize);
        } else {
          state.lastResult = dataResponse.count;
          state.firstResult = dataResponse.count - dataResponse.results.length + 1;
          state.pages = page;
        }
      } else {
        // We could calculate SOME numbers but not always
        state.firstResult = '?';
        state.lastResult = '?';
        state.pages = '?';
      }
      return state;
    }
  }, {
    key: 'reportError',
    value: function reportError(err) {
      if (deps.window.console) {
        deps.window.console.error(err);
      }
    }
  }]);
  return DataLoader;
}();

var DataRequest = function () {
  function DataRequest(params) {
    babelHelpers.classCallCheck(this, DataRequest);

    Object.assign(this, params);
  }

  babelHelpers.createClass(DataRequest, [{
    key: 'flatten',
    value: function flatten() {
      // TODO if we're relying on flatten so much,
      // what's the benefit of having filters un-flattened by default?
      return Object.assign({ page: this.page, ordering: this.ordering }, this.filters);
    }
  }]);
  return DataRequest;
}();

function delayed(delay, fn, argFn) {
  // Wrap fn with a function that calls fn after given delay.
  // If argFn is passed, fn will be scheduled to be called with argFn(...args)
  // instead of actual passed args.
  // Sorry :(
  var timeout = null;
  return function () {
    if (timeout) {
      clearTimeout(timeout);
    }

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var callArgs = argFn ? argFn.apply(undefined, args) : args;
    timeout = setTimeout(function () {
      return fn.apply(undefined, babelHelpers.toConsumableArray(callArgs));
    }, delay);
  };
}

function pick(o, fields) {
  return fields.reduce(function (a, x) {
    if (o.hasOwnProperty(x)) a[x] = o[x];
    return a;
  }, {});
}

function objectValueFilter(fn, obj) {
  return Object.keys(obj).reduce(function (res, key) {
    if (fn(obj[key])) {
      res[key] = obj[key];
    }
    return res;
  }, {});
}

function validate(f) {
  var errors = [];
  var checkCondition = function checkCondition(cond, label, message) {
    if (!cond) {
      errors.push(label + " " + message);
    }
  };
  var checkObj = {
    defined: function defined(val, label) {
      return checkCondition(typeof val !== 'undefined', label, "should be defined");
    },
    number: function number(val, label) {
      return checkCondition(typeof val === 'number', label, "should be a number");
    },
    numberOrNull: function numberOrNull(val, label) {
      return checkCondition(val === null || typeof val === 'number', label, "should be a number or null");
    },
    array: function array(val, label) {
      return checkCondition(val.constructor === Array, label, "should be an array");
    },
    string: function string(val, label) {
      return checkCondition(typeof val === 'string', label, "should be a string");
    },
    object: function object(val, label) {
      return checkCondition(val && (typeof val === 'undefined' ? 'undefined' : babelHelpers.typeof(val)) === 'object', label, "should be an object");
    }
  };
  try {
    f(checkObj);
  } catch (e) {
    if (errors.length === 0) {
      errors.push(e);
    } else {
      // Ignore, previous errors should be meaningful enough.
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  return true;
}

RTable.AjaxDataSource = AjaxDataSource;

export default RTable;