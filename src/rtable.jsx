/* global React */
class RTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      results: []
    };
    this.loader = new RTable.DataLoader(this, this.props.dataUrl);
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
        {this.state.ordering == col.name ? "\u25B2" :
         this.state.ordering == "-"+col.name ? "\u25BC" :
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
            page {this.state.page} of {this.state.pages},
            results {this.state.firstResult}-{this.state.lastResult} of {this.state.count}
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
                        <option key={j} value={choice.value}>{choice.label || choice.value}</option>
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

class DataLoader {
  constructor(component, baseUrl) {
    this.component = component;
    this.baseUrl = baseUrl;
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
    let data = parseUri(this.getWindowLocation()).queryKey;
    data.page = data.page || "1";
    this.component.setState({
      initialFilterState: data
    });
    // TODO only read stuff that you understand, don't just take the whole window's QS
    let initialDataUrl = updateQueryStringMultiple(data, this.baseUrl);
    this.loadFromURL(initialDataUrl);
  }
  getWindowLocation() {
    return window.location;
  }
  currentState() {
    return this.component.state;
  }
  loadWithUpdatedParams(newParams) {
    let newDataUrl = updateQueryStringMultiple(newParams, this.currentState().dataUrl);
    let newWindowUrl = updateQueryStringMultiple(newParams, window.location.href);
    if (window.history.replaceState) {
      window.history.replaceState({}, '', newWindowUrl);
    }
    return this.loadFromURL(newDataUrl);
  }
  loadFromURL(dataUrl) {
    return getJson(dataUrl)
    .then(response => {
      let state = this.buildStateFromResponse(response, dataUrl);
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
    if (this.currentState().ordering == ordering) {
      if (ordering[0] == '-') {
        ordering = ordering.substr(1);
      } else {
        ordering = '-'+ordering;
      }
    }
    return this.orderBy(event, ordering);
  }
  filter(event, key) {
    let newFilterValue = event.target.value || null;
    return this.loadWithUpdatedParams({[key]: newFilterValue});
  }
  buildStateFromResponse(response, dataUrl) {
    let divideRoundUp = (a, b) => Math.floor((a+b-1)/b);
    let parsedUrl = parseUri(dataUrl);
    let urlParams = parsedUrl.queryKey;
    let query = '?' + parsedUrl.query;
    let page = parseInt(urlParams.page) || 1;
    let page0 = page - 1;
    let state = {
      count: response.count,
      next: response.next,
      previous: response.previous,
      results: response.results,
      dataUrl: dataUrl,
      page: page,
      page0: page - 1,
      hasNext: !!response.next,
      hasPrev: !!response.previous,
      nextQuery: updateQueryString('page', page+1, query),
      prevQuery: updateQueryString('page', page-1, query),
      ordering: urlParams.ordering || null
    };
    if (response.next) {
      let pageSize = response.results.length;
      state.pages = divideRoundUp(response.count, pageSize);
      state.firstResult = pageSize * page0 + 1;
      state.lastResult = pageSize * (page0+1);
    } else {
      state.pages = page;
      state.lastResult = response.count;
      state.firstResult = response.count - response.results.length + 1;
    }
    return state;
  }
}

RTable.DataLoader = DataLoader;

function getJson(url) {
  var request = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    request.open('GET', url, true);
    request.onreadystatechange = function() {
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
  let timeout = null;
  return function() {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn.apply(null, arguments), delay);
  };
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
