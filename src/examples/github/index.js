import React from "react";
import { render } from "react-dom";

import { getCached } from "../utils/network";
import { RTable, URLQueryStorage } from "../../index";
import { BootstrapView } from "../../views/";
import { SimplePagination } from "../../pagination";

async function getCommitsFromGithub(query) {
  const { page = 1 } = query;
  const items = await getCached(
    "https://api.github.com/repos/tomchristie/django-rest-framework/commits" +
      "?per_page=5" +
      "&page=" +
      page
  );
  // Navigation is in headers!
  return {
    items,
    pagination: new SimplePagination({
      page,
      hasMore: true /* TODO proper pagination */,
    }),
  };
}

function GithubTable() {
  const columns = [
    {
      name: "author_avatar",
      label: "",
      valueFor: commit =>
        commit.author ? (
          <img src={commit.author.avatar_url} width={48} height={48} />
        ) : (
          ""
        ),
    },
    {
      name: "author",
      label: "Author",
      valueFor: commit => commit.commit.author.name,
    },
    { name: "sha", label: "#" },
    {
      name: "msg",
      label: "Message",
      valueFor: commit => <pre>{commit.commit.message}</pre>,
      // valueFor: function(commit) {
      // return pre(commit.commit.message);
      // },
    },
  ];

  return (
    <RTable
      queryStorage={new URLQueryStorage()}
      dataSource={getCommitsFromGithub}
    >
      {({ pagination, items, updateQuery }) => (
        <BootstrapView
          pagination={pagination}
          items={items}
          updateQuery={updateQuery}
          columns={columns}
        />
      )}
    </RTable>
  );
}

window.initGithubExample = function(container) {
  render(<GithubTable />, container);
};

/*
<!doctype html>
<html>
  <head>
    <title>RTable demo</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.6/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.6/css/bootstrap-theme.min.css">
  </head>
  <body>
    <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/0.14.6/react-with-addons.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/0.14.6/react-dom.min.js"></script>
    <script src="dist/rtable.js"></script>
    <div class="container">
      <h1><a href="https://github.com/Kos/rtable">RTable</a> demo</h1>
      <p>Uses Github API as the example data source.</p>
      <div id="react-container"</div>
    </div>
    <script>
    var GithubCommits = new RTable.AjaxDataSource({
      baseUrl: 'https://api.github.com/repos/tomchristie/django-rest-framework/commits?per_page=10',
      onResponse: function(response) {
        return {
          count: null,
          next: response.getUrlParamFromLinkHeader('page', 'next'),
          previous: response.getUrlParamFromLinkHeader('page', 'prev'),
          results: response.json
        };
      }
    });

    function pre(str) {
      return React.createElement('pre', { style: { 'whiteSpace': 'pre-wrap' }}, str);
    }
    function img(src, width) {
      return React.createElement("img", { src: src, width: width });
    }

    ReactDOM.render(
      React.createElement(RTable, {
        dataSource: GithubCommits,
        columns: [
          {name: "author_avatar", label: "", get: function(commit) { return commit.author ? img(commit.author.avatar_url, 48) : ''; }},
          {name: "author", label: "Author", get: function(commit) { return commit.commit.author.name; }},
          {name: "sha", label: "#"},
          {name: "msg", label: "Message", get: function(commit) { return pre(commit.commit.message); }},
        ],
        filters: [
          {'label': 'Path', 'name': 'path'},
          {'label': 'Version', 'name': 'sha', 'choices': [
            'master',
            'gh-pages',
            '3.3.2',
            '3.3.1',
            '3.3.0',
            '3.2.5',
            '3.2.3',
          ]},
        ]
      }),
      document.getElementById('react-container')
    );

    </script>
  </body>
</html>
 */
