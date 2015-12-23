/* global React */
class RTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      results: []
    };
    this.loader = new RTable.DataLoader(this, this.props.dataUrl);
  }
  componentDidMount() {
    this.loader.loadInitial();
  }
  render() {
    let header = this.props.columns.map((col, n) =>
      <th key={n} onClick={this.loader.fn.orderToggle(col.key)}>
        {col.name}
        {this.state.ordering == col.key ? "\u25B2" :
         this.state.ordering == "-"+col.key ? "\u25BC" :
         null
        }
      </th>
    );
    let rows = this.state.results.map((row, m) => {
      let cells = this.props.columns.map((col, n) =>
        <td key={n}>{row[col.key]}</td>
      );
      return <tr key={m}>{cells}</tr>;
    });

    return (
      <table className="table table-striped table-hover">
        <thead>
          <tr><td className="text-center" colSpan={this.props.columns.length}>
            {this.state.hasPrev ? <a className="btn btn-primary" href={this.state.prevQuery} onClick={this.loader.fn.prevPage}>prev</a> : null}
            {' '}
            page {this.state.page} of {this.state.pages},
            results {this.state.firstResult}-{this.state.lastResult} of {this.state.count}
            {' '}
            {this.state.hasNext ? <a className="btn btn-primary" href={this.state.nextQuery} onClick={this.loader.fn.nextPage}>next</a> : null}
          </td></tr>
          <tr>{header}</tr>
        </thead>
        <tbody>
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
    this.fn = {
      goToPage: this.goToPage.bind(this),
      nextPage: this.nextPage.bind(this),
      prevPage: this.prevPage.bind(this),
      orderBy: column => (event => this.orderBy(event, column)),
      orderToggle: column => (event => this.orderToggle(event, column))
    }
  }
  loadInitial() {
    let page = parseUri(window.location).queryKey.page || 1;
    let url = UpdateQueryString('page', page, this.baseUrl);
    this.load(url);
  }
  currentState() {
    return this.component.state;
  }
  load(url) {
    let divideRoundUp = (a, b) => Math.floor((a+b-1)/b);
    let parsedUrl = parseUri(url);
    let urlParams = parsedUrl.queryKey;
    return getJson(url)
    .then(response => {
      // have: count, next, previous, results
      response.fullUrl = url;
      response.query = '?' + parsedUrl.query;
      response.page = parseInt(urlParams.page) || 1;
      response.page0 = response.page - 1;
      response.hasNext = !!response.next;
      response.hasPrev = !!response.previous;
      response.nextQuery = UpdateQueryString('page', response.page+1, response.query);
      response.prevQuery = UpdateQueryString('page', response.page-1, response.query);
      response.ordering = urlParams.ordering || null;
      // response.prevQuery = !!response.next;
      if (response.next) {
        let pageSize = response.results.length;
        response.pages = divideRoundUp(response.count, pageSize);
        response.firstResult = pageSize * response.page0 + 1;
        response.lastResult = pageSize * (response.page0+1);
      } else {
        response.pages = response.page;
        response.lastResult = response.count;
        response.firstResult = response.count - response.results.length + 1;
      }
      this.component.setState(response);
      return response;
    });
  }
  goToPage(event, page) {
    if (event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    let newDataUrl = UpdateQueryString('page', page, this.currentState().fullUrl);
    let newWindowUrl = UpdateQueryString('page', page);
    if (window.history.replaceState) {
      window.history.replaceState({}, '', newWindowUrl);
    }
    return this.load(newDataUrl);
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
    let newDataUrl = UpdateQueryString('ordering', ordering, this.currentState().fullUrl);
    let newWindowUrl = UpdateQueryString('ordering', ordering);
    if (window.history.replaceState) {
      window.history.replaceState({}, '', newWindowUrl);
    }
    return this.load(newDataUrl);
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
function UpdateQueryString(key, value, url) {
  if (!url) url = window.location.href;
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
