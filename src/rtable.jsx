/* global React */

class RTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      results: []
    };
    let dataSource = this.props.dataSource || new DefaultDataSource(this.props.dataUrl);
    this.loader = new RTable.DataLoader(this, dataSource);
  }
  componentWillMount() {
    this.loader.loadInitial();
  }
  getValue(row, col) {
    if (col.get) {
      return col.get(row);
    }
    return row[col.name];
  }
  render() {
    let filters = this.props.filters || [];
    let columns = this.props.columns || [];
    let header = columns.map((col, n) =>
      <th key={n} onClick={this.loader.fn.orderToggle(col.name)}>
        {col.label || col.name}
        {this.state.ordering === col.name ? "\u25B2" :
         this.state.ordering === "-"+col.name ? "\u25BC" :
         null
        }
      </th>
    );
    let rows = this.state.results.map((row, m) => {
      let cells = this.props.columns.map((col, n) =>
        <td key={n}>{this.getValue(row, col)}</td>
      );
      return <tr key={m}>{cells}</tr>;
    });
    return (
      <table className="table table-striped table-hover">
        <thead>
          <tr><td ref="paginationContainer" className="text-center" colSpan={columns.length}>
            {this.state.hasPrev
              ? <a ref="paginationPrevious" className="btn btn-primary t-prev" href={this.state.prevQuery} onClick={this.loader.fn.prevPage}>prev</a>
              : <button ref="paginationPrevious" className="btn btn-primary t-prev" disabled>prev</button> }
            {' '}
            <PaginationInfo {...this.state} />
            {' '}
            {this.state.hasNext
              ? <a ref="paginationNext" className="btn btn-primary t-next" href={this.state.nextQuery} onClick={this.loader.fn.nextPage}>next</a>
              : <button ref="paginationNext" className="btn btn-primary t-next" disabled>next</button> }
          </td></tr>
          <tr ref="filterRow"><td className="form-inline" colSpan={columns.length}>
            {filters.map((filter, i) =>
              <span key={i}>
                <label>
                  {filter.label+':'}
                </label>
                {' '}
                {filter.choices
                  ? <select className="form-control input-sm " onInput={this.loader.fn.filter(filter.name)} defaultValue={this.state.initialFilterState[filter.name]}>
                      {filter.choices.map((choice, j) =>
                        <FilterChoiceOption key={j} choice={choice} />
                      )}
                    </select>
                  : <input className="form-control input-sm" onInput={this.loader.fn.filterDelayed(filter.name)} defaultValue={this.state.initialFilterState[filter.name]} />
                }
                {' '}
              </span>
            )}
          </td></tr>
          <tr ref="columnHeaderRow">{header}</tr>
        </thead>
        <tbody ref="rowContainer">
          {rows}
        </tbody>
      </table>
    );
  }
}

function PaginationInfo(props) {
  if (props.count === '?') {
    return <span>page {props.page}</span>;
  }
  return <span>
    page {props.page} of {props.pages},
    results {props.firstResult}-{props.lastResult} of {props.count}
  </span>;
}

function FilterChoiceOption({choice}) {
  if (choice === null) {
    choice = {
      label: "",
      value: null
    };
  } else if (typeof choice !== "object") {
    choice = {
      label: choice.toString(),
      value: choice.toString()
    };
  }
  return <option value={choice.value}>{choice.label || choice.value}</option>;
}

class DataLoader {
  constructor(component, dataSource) {
    this.component = component;
    this.dataSource = dataSource;
    this.filterDelay = 800;
    this.fn = {
      goToPage: this.goToPage.bind(this),
      nextPage: this.nextPage.bind(this),
      prevPage: this.prevPage.bind(this),
      orderBy: column => (event => this.orderBy(event, column)),
      orderToggle: column => (event => this.orderToggle(event, column)),
      filter: key => (event => this.filter(event, key)),
      filterDelayed: key => delayed(this.filterDelay, event => this.filter(event, key))
    };
  }
  loadInitial() {
    let initialDataRequest = this.decodeWindowUrl();
    this.component.setState({
      initialFilterState: initialDataRequest.filters
    });
    this.loadFromSource(initialDataRequest);
  }
  getWindowLocation() {
    return window.location.href;
  }
  currentState() {
    return this.component.state;
  }
  loadWithUpdatedParams(newParams) {
    let state = this.currentState();
    let newDataRequest = new DataRequest({
      page: (newParams.page !== undefined ? newParams.page : state.page),
      ordering: (newParams.ordering !== undefined ? newParams.ordering : state.ordering),
      filters: Object.assign({}, state.filters, newParams.filters || {})
    });
    if (window.history.replaceState) {
      window.history.replaceState({}, '', this.encodeWindowUrl(newDataRequest));
    }
    return this.loadFromSource(newDataRequest);
  }
  encodeWindowUrl(dataRequest) {
    return updateQueryStringMultiple(dataRequest.flatten(), this.getWindowLocation());
  }
  decodeWindowUrl() {
    let data = parseUri(this.getWindowLocation()).queryKey;
    let initialFilterState = data;
    // TODO only read stuff that you understand, don't just take the whole window's QS
    return new DataRequest({
      "page": data.page || 1,
      "ordering": data.ordering || null,
      "filters": initialFilterState
    });
  }
  loadFromSource(dataRequest) {
    return this.dataSource.get(dataRequest)
    .then(response => {
      let state = this.buildStateFromResponse(response, dataRequest);
      this.component.setState(state);
      return state;
    });
  }
  goToPage(event, page) {
    if (event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    return this.loadWithUpdatedParams({page});
  }
  nextPage(event) {
    return this.goToPage(event, this.currentState().page+1);
  }
  prevPage(event) {
    return this.goToPage(event, this.currentState().page-1);
  }
  orderBy(event, ordering) {
    if (event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    return this.loadWithUpdatedParams({ordering});
  }
  orderToggle(event, ordering) {
    if (!ordering.length) {
      return;
    }
    if (this.currentState().ordering === ordering) {
      if (ordering[0] === '-') {
        ordering = ordering.substr(1);
      } else {
        ordering = '-'+ordering;
      }
    }
    return this.orderBy(event, ordering);
  }
  filter(event, key) {
    let newFilterValue = event.target.value || null;
    return this.loadWithUpdatedParams({filters: {[key]: newFilterValue}});
  }
  buildStateFromResponse(dataResponse, dataRequest) {
    let divideRoundUp = (a, b) => Math.floor((a+b-1)/b);
    let buildPageUrl = page => {
      let nextDR = Object.assign(new DataRequest(dataRequest), {page});
      return '?' + parseUri(this.encodeWindowUrl(nextDR)).query;
    };
    // TODO page ids should be opaque here.
    // don't special case 1, have the source support page null?
    // (UI support needed too)
    let page = parseInt(dataRequest.page) || 1;
    let page0 = page - 1;
    let haveCount = !isNullOrUndefined(dataResponse.count);
    let state = {
      count: haveCount ? dataResponse.count : '?',
      next: dataResponse.next,
      previous: dataResponse.previous,
      results: dataResponse.results,
      page: page,
      page0: page - 1,
      hasNext: !!dataResponse.next,
      hasPrev: !!dataResponse.previous,
      nextQuery: buildPageUrl(dataResponse.next),
      prevQuery: buildPageUrl(dataResponse.previous),
      ordering: dataRequest.ordering || null
    };
    if (haveCount) {
      if (dataResponse.next) {
        let pageSize = dataResponse.results.length;
        state.firstResult = pageSize * page0 + 1;
        state.lastResult = pageSize * (page0+1);
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
}

RTable.DataLoader = DataLoader;

class DataRequest {
  constructor(params) {
    Object.assign(this, params);
  }
  flatten() {
    // TODO if we're relying on flatten so much,
    // what's the benefit of having filters un-flattened by default?
    return Object.assign({page: this.page, ordering: this.ordering},
                         this.filters);
  }
}

class DefaultDataSource {
  // TODO implement on top of AjaxDataSource
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    // TODO this is a good place to allow to override how 'page' and 'ordering'
    // params are passed to the backend.
  }
  get(dataRequest) {
    let url = this.baseUrl;
    url = updateQueryStringMultiple(dataRequest.flatten(), url);
    return getJson(url).then(dataResponse => {
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
}

class AjaxDataSource {
  constructor({baseUrl, onResponse}) {
    this.baseUrl = baseUrl;
    this.onResponse = onResponse;
  }
  get(dataRequest) {
    let url = updateQueryStringMultiple(dataRequest.flatten(), this.baseUrl);
    return ajaxGet(url).then(xhr =>
      this.onResponse(new AjaxDataSourceResponse(xhr), dataRequest)
    );
  }
}

class AjaxDataSourceResponse {
  constructor(xhr) {
    this.xhr = xhr;
    this.json = this._tryLoadJson();
  }
  getUrlParamFromLinkHeader(param, rel) {
    let header = this.xhr.getResponseHeader('Link');
    let linkRegex = /<([^>]+)>; rel="(\w+)"/g;
    for (let groups; (groups=linkRegex.exec(header)); ) {
      let thisURL = groups[1];
      let thisRel = groups[2];
      if (thisRel === rel) {
        return this.getUrlParamFromURL(param, thisURL);
      }
    }
    return null;
  }
  getUrlParamFromURL(param, url) {
    return parseUri(url).queryKey[param];
  }
  _tryLoadJson() {
    let ct = this.xhr.getResponseHeader('content-type');
    if (!ct) return null;
    ct = ct.toLowerCase();
    ct = ct.split(";")[0].trim();  // ; charset=...
    if (ct !== 'application/json') return null;
    try {
      return JSON.parse(this.xhr.responseText);
    } catch(e) {
      return null;
    }
  }
}

function getJson(url) {
  return ajaxGet(url, 'json');
}

function ajaxGet(url, res='xhr') {
  var request = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    request.open('GET', url, true);
    request.onreadystatechange = function() {
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

function delayed(delay, fn) {
  let timeout = null;
  return function() {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn.apply(null, arguments), delay);
  };
}

function isNullOrUndefined(x) {
  return x == null;  // eslint-disable-line eqeqeq
}

/* ------------- */
/* packaged deps */


// http://blog.stevenlevithan.com/archives/parseuri
function parseUri (str) {
  var o   = parseUri.options,
    m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    uri = {},
    i   = 14;

  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
}

parseUri.options = {
  strictMode: false,
  key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
  q:   {
    name:   "queryKey",
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};

// http://stackoverflow.com/a/11654596/399317
function updateQueryString(key, value, url) {
  var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi");
  var hash;

  if (re.test(url)) {
    if (typeof value !== 'undefined' && value !== null)
      return url.replace(re, '$1' + key + "=" + value + '$2$3');
    else {
      hash = url.split('#');
      url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
      if (typeof hash[1] !== 'undefined' && hash[1] !== null)
        url += '#' + hash[1];
      return url;
    }
  }
  else {
    if (typeof value !== 'undefined' && value !== null) {
      var separator = url.indexOf('?') !== -1 ? '&' : '?';
      hash = url.split('#');
      url = hash[0] + separator + key + '=' + value;
      if (typeof hash[1] !== 'undefined' && hash[1] !== null)
        url += '#' + hash[1];
      return url;
    }
    else
      return url;
  }
}

function updateQueryStringMultiple(obj, url) {
  Object.keys(obj).forEach(key => {url = updateQueryString(key, obj[key], url);});
  return url;
}
