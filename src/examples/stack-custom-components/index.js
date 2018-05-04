import React from "react";
import { render } from "react-dom";

import { getCached } from "../utils/network";
import { StackOverflowUser } from "./components";
import { RTable } from "../../index";
import { SimplePagination } from "../../pagination";

async function getUsersFromStack(query) {
  const { page = 1 } = query;
  const { items, has_more: hasMore } = await getCached(
    "https://api.stackexchange.com/2.2/users" +
      "?site=stackoverflow" +
      "&page=" +
      encodeURIComponent(page)
  );
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
  return (
    <RTable queryStorage={queryStorage} dataSource={getUsersFromStack}>
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
