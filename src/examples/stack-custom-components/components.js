import React from "react";
import PropTypes from "prop-types";

export function StackOverflowUser({ user }) {
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
          <Reputation value={user.reputation} />
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
StackOverflowUser.propTypes = {
  user: PropTypes.object.isRequired,
};

function Reputation({ value }) {
  return <span className="reputation-score">{formatRep(value)}</span>;
}
Reputation.propTypes = {
  value: PropTypes.number.isRequired,
};

function formatRep(number) {
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
}

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
Badges.propTypes = {
  name: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
};
