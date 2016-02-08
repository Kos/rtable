import { isNullOrUndefined } from './utils';
import { parseUri, updateQueryStringMultiple } from './UrlUtils';


export class AjaxDataSource {
  constructor({baseUrl, onResponse}) {
    this.baseUrl = baseUrl;
    this.onResponse = onResponse;
  }
  get(dataRequest) {
    let url = updateQueryStringMultiple(dataRequest.flatten(), this.baseUrl);
    return deps.ajaxGet(url).then(xhr =>
      this.onResponse(new deps.AjaxDataSourceResponse(xhr), dataRequest)
    );
  }
}


export class AjaxDataSourceResponse {
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


export class DefaultDataSource {
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


function getJson(url) {
  return deps.ajaxGet(url, 'json');
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

export let deps = {
  ajaxGet: ajaxGet,
  AjaxDataSourceResponse: AjaxDataSourceResponse
};
