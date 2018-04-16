import { RTable } from "./index";
import { render } from "react-dom";
import { createElement as h } from "react";
/* eslint-env browser */

async function getUsersFromStack() {
  const users = sessionStorage.getItem("stackUsers");
  if (users) {
    return JSON.parse(users);
  }
  const response = await fetch(
    "https://api.stackexchange.com/2.2/users?site=stackoverflow"
  );
  const json = await response.json();
  const output = {
    items: json.items,
    pagination: {},
  };
  sessionStorage.setItem("stackUsers", JSON.stringify(output));
  return output;
}

function StackOverflowTable() {
  const queryStorage = {
    get: () => Promise.resolve({}),
    set: () => Promise.resolve(),
  };
  const dataSource = getUsersFromStack;
  return h(RTable, { queryStorage, dataSource }, ({ items }) => {
    return h(
      "div",
      { style: { display: "flex", flexWrap: "wrap" } },
      items.map(item => h(StackOverflowUser, { user: item, key: item.user_id }))
    );
  });
}

function StackOverflowUser({ user }) {
  return div(
    "user-info ",
    div(
      "user-gravatar32",
      a(
        user.website_url,
        div("gravatar-wrapper-32", img(user.profile_image, 32, 32))
      )
    ),
    div(
      "user-details",
      a(user.link, user.display_name),
      div(
        "-flair",
        span("reputation-score", rep(user.reputation)),
        badges("gold", user.badge_counts ? user.badge_counts.gold : 0),
        badges("silver", user.badge_counts ? user.badge_counts.silver : 0),
        badges("bronze", user.badge_counts ? user.badge_counts.bronze : 0)
      )
    )
  );
}

const div = (className, ...args) => h("div", { className }, ...args);
const span = (className, ...args) => h("span", { className }, ...args);
const spanTitle = (title, ...args) => h("span", { title }, ...args);
const a = (href, ...args) => h("a", { href }, ...args);
const img = (src, width, height) => h("img", { src, width, height, alt: "" });

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

const badges = (name, count) => {
  if (!count) {
    return null;
  }
  return spanTitle(
    `${count} ${name} badge${count > 1 ? "s" : ""}`,
    span("badge" + { gold: 1, silver: 2, bronze: 3 }[name]),
    span("badgecount", count)
  );
};

window.stackOverflowExample = container => {
  const elt = h(StackOverflowTable);
  render(elt, container);
};
