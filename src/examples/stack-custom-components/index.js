import { render } from "react-dom";
import React from "react";

import { RTable } from "../../index";
import { SimplePagination } from "../../pagination";

import StackOverflowUser from "./components";
/* eslint-env browser */

function cached(fn, prefix, storage) {
  return async function wrapped(...args) {
    const key = prefix + JSON.stringify(args);
    const value = storage.getItem(key);
    if (value !== null) {
      return JSON.parse(value);
    }
    const newValue = await fn(...args);
    storage.setItem(key, JSON.stringify(newValue));
    return newValue;
  };
}

async function getUsersFromStack(query) {
  const { page = 1 } = query;
  const response = await fetch(
    "https://api.stackexchange.com/2.2/users?site=stackoverflow" +
      "&page=" +
      encodeURIComponent(page)
  );
  const { items, has_more: hasMore } = await response.json();
  return {
    items,
    pagination: new SimplePagination({ page, hasMore }),
  };
}

function StackOverflowTable() {
  const queryStorage = {
    get: () => Promise.resolve({}),
    set: () => Promise.resolve(),
  };
  const dataSource = cached(
    getUsersFromStack,
    "getUsersFromStack",
    sessionStorage
  );
  return (
    <RTable queryStorage={queryStorage} dataSource={dataSource}>
      {({ pagination, items, updateQuery }) => (
        <div>
          <div>
            Page {pagination.page}, hasMore:{" "}
            {pagination.hasMore ? "true" : "false"}
            <button
              disabled={!pagination.previousPage}
              onClick={() => updateQuery({ page: pagination.previousPage })}
            >
              Prev
            </button>
            <button
              disabled={!pagination.nextPage}
              onClick={() => updateQuery({ page: pagination.nextPage })}
            >
              Next
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {items.map(item => (
              <StackOverflowUser user={item} key={item.user_id} />
            ))}
          </div>
        </div>
      )}
    </RTable>
  );
}

window.initStackOverflowExample = function(container) {
  render(<StackOverflowTable />, container);
};
