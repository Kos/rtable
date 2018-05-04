export class URLQueryStorage {
  constructor() {}

  async get() {
    const url = window.location.href;
    const { queryKey } = parseUri(url);
    // Just return all for now...
    return queryKey;
  }

  async set(queryKey) {
    const currentUrl = window.location.href;
    const newUrl = updateQueryStringMultiple(queryKey, currentUrl);
    window.history.replaceState("pageObj", "title", newUrl);
  }
}

// http://blog.stevenlevithan.com/archives/parseuri
export function parseUri(str) {
  var o = parseUri.options,
    m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    uri = {},
    i = 14;

  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
}

parseUri.options = {
  strictMode: false,
  key: [
    "source",
    "protocol",
    "authority",
    "userInfo",
    "user",
    "password",
    "host",
    "port",
    "relative",
    "path",
    "directory",
    "file",
    "query",
    "anchor",
  ],
  q: {
    name: "queryKey",
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g,
  },
  parser: {
    /* eslint-disable no-useless-escape */
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
  },
};

// http://stackoverflow.com/a/11654596/399317
export function updateQueryString(key, value, url) {
  var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi");
  var hash;

  if (re.test(url)) {
    if (typeof value !== "undefined" && value !== null)
      return url.replace(re, "$1" + key + "=" + value + "$2$3");
    else {
      hash = url.split("#");
      url = hash[0].replace(re, "$1$3").replace(/(&|\?)$/, "");
      if (typeof hash[1] !== "undefined" && hash[1] !== null)
        url += "#" + hash[1];
      return url;
    }
  } else {
    if (typeof value !== "undefined" && value !== null) {
      var separator = url.indexOf("?") !== -1 ? "&" : "?";
      hash = url.split("#");
      url = hash[0] + separator + key + "=" + value;
      if (typeof hash[1] !== "undefined" && hash[1] !== null)
        url += "#" + hash[1];
      return url;
    } else return url;
  }
}

export function updateQueryStringMultiple(obj, url) {
  Object.keys(obj).forEach(key => {
    url = updateQueryString(key, obj[key], url);
  });
  return url;
}
