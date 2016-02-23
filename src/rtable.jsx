import React from 'react';
import { parseUri, updateQueryStringMultiple } from './UrlUtils';
import { isNullOrUndefined } from './utils';
import { DefaultDataSource } from './AjaxDataSource';

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
      let values = columns.map(col => this.getValue(row, col));
      return <Item key={m} data={row} values={values} />;
    });
    return (
      <table className="table table-striped table-hover" ref="table">
        <thead>
          <tr>
            <td ref="paginationContainer" className="text-center" colSpan={columns.length}>
              <Pagination loader={this.loader} {...this.state} />
            </td>
          </tr>
          <tr>
            <td ref="filterContainer" className="form-inline" colSpan={columns.length}>
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
            </td>
          </tr>
          <tr ref="columnHeaderRow">
            {header}
          </tr>
        </thead>
        <tbody ref="rowContainer">
          {rows}
        </tbody>
      </table>
    );
  }
  find(cls) {
    return this.refs.table.querySelector(cls);
  }
}

function Item(props) {  // eslint-disable-line no-unused-vars
  let cells = props.values.map((col, n) =>
    <td key={n}>{col}</td>
  );
  return <tr>{cells}</tr>;
}

function Pagination(props) { // eslint-disable-line no-unused-vars
  let paginationInfo;
  if (props.count === '?') {
    paginationInfo = <span>page {props.page}</span>;
  } else {
    paginationInfo = <span>
      page {props.page} of {props.pages},
      results {props.firstResult}-{props.lastResult} of {props.count}
    </span>;
  }

  // TODO configurable classes; only add t-next t-prev in tests
  let btn = (text, cls, cond, href, onClick) => (
      cond ? <a className={"btn btn-primary "+cls} href={href} onClick={onClick}>{text}</a>
           : <button className={"btn btn-primary "+cls} disabled>{text}</button>
  );

  return (
    <span>
      {btn("prev", "t-prev", props.hasPreviousPage, props.prevQuery, props.loader.fn.prevPage)}
      {' '}
      { paginationInfo }
      {' '}
      {btn("next", "t-next", props.hasNextPage, props.nextQuery, props.loader.fn.nextPage)}
    </span>
  );
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
      filter: key => (event => this.filter(event.target, key)),
      filterDelayed: key => delayed(this.filterDelay,
                                    eventTarget => this.filter(eventTarget, key),
                                    event => [event.target])
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
    let clearNulls = obj => objectValueFilter(x => !isNullOrUndefined(x), obj);
    let newDataRequest = new DataRequest({
      page: (newParams.page !== undefined ? newParams.page : state.page),
      ordering: (newParams.ordering !== undefined ? newParams.ordering : state.ordering),
      filters: clearNulls(Object.assign({}, state.filters, newParams.filters || {}))
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
        check.numberOrNull(resp.count, "resp.count");
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
    return this.goToPage(event, this.currentState().nextPage);
  }
  prevPage(event) {
    return this.goToPage(event, this.currentState().previousPage);
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
  filter(eventTarget, key) {
    // HACK? This takes eventTarget, not Event,
    // since react recycles event objects
    // which make this not work with delayed()
    let newFilterValue = eventTarget.value || null;
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
    if (deps.window.console) {
      deps.window.console.error(err);
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

function delayed(delay, fn, argFn) {
  // Wrap fn with a function that calls fn after given delay.
  // If argFn is passed, fn will be scheduled to be called with argFn(...args)
  // instead of actual passed args.
  // Sorry :(
  let timeout = null;
  return function(...args) {
    if (timeout) {
      clearTimeout(timeout);
    }
    let callArgs = (argFn ? argFn(...args) : args);
    timeout = setTimeout(() => fn(...callArgs), delay);
  };
}

function pick(o, fields) {
  return fields.reduce((a, x) => {
    if(o.hasOwnProperty(x)) a[x] = o[x];
    return a;
  }, {});
}

function objectValueFilter(fn, obj) {
  return Object.keys(obj).reduce((res, key) => {
    if (fn(obj[key])) {
      res[key] = obj[key];
    }
    return res;
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
    numberOrNull: (val, label) => checkCondition(val === null || typeof val === 'number', label, "should be a number or null"),
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
    throw new Error(errors.join(', '));
  }
  return true;
}
