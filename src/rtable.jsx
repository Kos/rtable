import React from 'react';
import { parseUri, updateQueryStringMultiple } from './UrlUtils';
import { isNullOrUndefined } from './utils';
import { DefaultDataSource, AjaxDataSource } from './AjaxDataSource';

export let deps = {
  window: window
};

export default class RTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      results: []
    };
    let dataSource = this.props.dataSource || new DefaultDataSource(this.props.dataUrl);
    this.loader = new DataLoader(this, dataSource);
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
    let ordering = this.props.ordering || [];
    let isOrderable = colName => (ordering === "all" || ordering.some(x => x === colName));
    let header = columns.map((col, n) =>
      <th key={n} onClick={isOrderable(col.name) ? this.loader.fn.orderToggle(col.name) : null}>
        {col.label || col.name}
        {this.state.ordering === col.name ? "\u25B2" :
         this.state.ordering === "-"+col.name ? "\u25BC" :
         null
        }
      </th>
    );
    let rows = this.state.results.map((row, m) => {
      let cells = columns.map((col, n) =>
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

function PaginationInfo(props) { // eslint-disable-line no-unused-vars
  if (props.count === '?') {
    return <span>page {props.page}</span>;
  }
  return <span>
    page {props.page} of {props.pages},
    results {props.firstResult}-{props.lastResult} of {props.count}
  </span>;
}

function FilterChoiceOption({choice}) { // eslint-disable-line no-unused-vars
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
    return deps.window.location.href;
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
    if (deps.window.history && deps.window.history.replaceState) {
      deps.window.history.replaceState({}, '', this.encodeWindowUrl(newDataRequest));
    }
    return this.loadFromSource(newDataRequest);
  }
  encodeWindowUrl(dataRequest) {
    return updateQueryStringMultiple(dataRequest.flatten(), this.getWindowLocation());
  }
  decodeWindowUrl() {
    let data = parseUri(this.getWindowLocation()).queryKey;
    let filters = this.component.props.filters || [];
    let filterExists = name => filters.some(f => f.name === name);
    let filterState = pick(data, Object.keys(data).filter(filterExists));
    return new DataRequest({
      "page": data.page || 1,
      "ordering": data.ordering || null,
      "filters": filterState
    });
  }
  loadFromSource(dataRequest) {
    let validateResponse = resp => {
      validate(check => {
        check.object(resp, "resp");
        check.number(resp.count, "resp.count");
        check.defined(resp.next, "resp.next");
        check.defined(resp.previous, "resp.previous");
        check.array(resp.results, "resp.results");
      });
      return resp;
    };
    return this.dataSource.get(dataRequest)
    .then(validateResponse)
    .then(response => {
      let state = this.buildStateFromResponse(response, dataRequest);
      this.component.setState(state);
      return state;
    })
    .catch(this.reportError.bind(this));
  }
  goToPage(event, page) {
    if (event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    return this.loadWithUpdatedParams({page});
  }
  nextPage(event) {
    return this.goToPage(event, this.currentState().next);
  }
  prevPage(event) {
    return this.goToPage(event, this.currentState().previous);
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

  reportError(err) {
    if (window.console) {
      window.console.error(err);
    }
  }
}

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

RTable.AjaxDataSource = AjaxDataSource;

function delayed(delay, fn) {
  let timeout = null;
  return function() {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn.apply(null, arguments), delay);
  };
}

function pick(o, fields) {
  return fields.reduce((a, x) => {
    if(o.hasOwnProperty(x)) a[x] = o[x];
    return a;
  }, {});
}


function validate(f) {
  let errors = [];
  let checkCondition = (cond, label, message) => {
    if (!cond) {
      errors.push(label + " " + message);
    }
  };
  let checkObj = {
    defined: (val, label) => checkCondition(typeof val !== 'undefined', label, "should be defined"),
    number: (val, label) => checkCondition(typeof val === 'number', label, "should be a number"),
    array: (val, label) => checkCondition(val.constructor === Array, label, "should be an array"),
    string: (val, label) => checkCondition(typeof val === 'string', label, "should be a string"),
    object: (val, label) => checkCondition(val && typeof val === 'object', label, "should be an object")
  };
  try {
    f(checkObj);
  } catch(e) {
    if (errors.length === 0) {
      errors.push(e);
    } else {
      // Ignore, previous errors should be meaningful enough.
    }
  }
  if (errors.length > 0) {
    throw new Error(errors);
  }
  return true;
}
