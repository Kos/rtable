import { RTable } from "./index";
import { SimplePagination } from "./pagination";
import { render } from "react-dom";
import React from "react";
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

function StackOverflowUser({ user }) {
  return (
    <div className="user-info">
      <div className="user-gravatar32">
        <a href={user.website_url}>
          <div className="gravatar-wrapper-32">
            <img
              src={user.profile_image}
              alt="Profile image"
              width={32}
              height={32}
            />
          </div>
        </a>
      </div>
      <div className="user-details">
        <a href={user.link}>{user.display_name}</a>
        <div className="-flair">
          <span className="reputation-score">{rep(user.reputation)}</span>
          <Badges
            name="gold"
            count={user.badge_counts ? user.badge_counts.gold : 0}
          />
          <Badges
            name="silver"
            count={user.badge_counts ? user.badge_counts.silver : 0}
          />
          <Badges
            name="bronze"
            count={user.badge_counts ? user.badge_counts.bronze : 0}
          />
        </div>
      </div>
    </div>
  );
}

const rep = number => {
  let suffix = "";
  if (number >= 10000) {
    number = number / 1000;
    suffix = "k";
  }
  if (number >= 100) {
    return Math.round(number).toLocaleString() + suffix;
  } else {
    return number.toFixed(1).toLocaleString() + suffix;
  }
};

const Badges = ({ name, count }) => {
  if (!count) {
    return null;
  }
  const title = `${count} ${name} badge${count > 1 ? "s" : ""}`;
  return (
    <span title={title}>
      <span className={"badge" + { gold: 1, silver: 2, bronze: 3 }[name]} />
      <span className="badgecount">{count}</span>
    </span>
  );
};

window.stackOverflowExample = container => {
  render(<StackOverflowTable />, container);
};
