/* global React */
class RTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      results: []
    };
    this.dataSource = new RTable.DataSource();
  }
  componentDidMount() {
    this.dataSource.get(this.props.dataUrl)
    .then(response => this.setState(response));
  }
  render() {
    let header = this.props.columns.map((col, n) =>
      <th key={n}>{col.name}</th>
    );
    let rows = this.state.results.map((row, m) => {
      let cells = this.props.columns.map((col, n) =>
        <td key={n}>{row[col.key]}</td>
      );
      return <tr key={m}>{cells}</tr>;
    });

    return (
      <table>
        <thead>
          <tr>{header}</tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
        <tfoot>
          <tr><td colSpan={this.props.columns.length}>
            page {this.state.page} of {this.state.pages},
            results {this.state.firstResult}-{this.state.lastResult} of {this.state.count}
            <a href="#" onClick={this.nextPage()}>next</a>
          </td></tr>
        </tfoot>
      </table>
    );
  }
  nextPage() {
    return event => {
      event.preventDefault();
      this.dataSource.next(this.state)
      .then(response => this.setState(response));
    }
  }
}

class DataSource {
  get(url) {
    let divideRoundUp = (a, b) => Math.floor((a+b-1)/b);
    let params = parseUri(url).queryKey;
    return getJson(url)
    .then(response => {
      // have: count, next, previous, results
      response.fullUrl = url;
      response.page = parseInt(params.page) || 1;
      response.page0 = response.page - 1;
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
      return response;
    });
  }
  goToPage(response, page) {
    // debugger;
    let newUrl = UpdateQueryString('page', page, response.fullUrl);

    return this.get(newUrl);
  }
  next(response) {
    return this.goToPage(response, response.page+1);
  }
  prev(response) {
    return this.goToPage(response, response.page-1);
  }
}

RTable.DataSource = DataSource;

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
