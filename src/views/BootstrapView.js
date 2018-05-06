import React, { PureComponent } from "react";

export default class BootstrapView extends PureComponent {
  render() {
    const { columns, items, pagination, updateQuery } = this.props;
    function updatePage(page) {
      return () => updateQuery({ page });
    }

    return (
      <table className="table table-striped">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, id) => (
            <tr key={id}>
              {columns.map((column, index) => (
                <td key={index}>{valueFor(column, item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={columns.length} className="text-center">
              <button>Refresh</button>{" "}
              <button
                disabled={pagination.page == pagination.firstPage}
                onClick={updatePage(pagination.firstPage)}
              >
                First
              </button>{" "}
              <button
                disabled={!pagination.previousPage}
                onClick={updatePage(pagination.previousPage)}
              >
                Prev
              </button>{" "}
              Page <input readOnly value={pagination.page} /> of{" "}
              {pagination.pageCount || "?"}{" "}
              <button
                disabled={!pagination.nextPage}
                onClick={updatePage(pagination.nextPage)}
              >
                Next
              </button>{" "}
              <button
                disabled={
                  !pagination.lastPage || pagination.page == pagination.lastPage
                }
                onClick={updatePage(pagination.lastPage)}
              >
                Last
              </button>{" "}
              {/* View {pagination.firstDisplayedItem} -{" "} */}
              {/* {pagination.lastDisplayedItem} of {pagination.itemCount} */}
            </td>
          </tr>
        </tfoot>
      </table>
    );
  }
}

function valueFor(column, item) {
  if (column.valueFor) {
    return column.valueFor(item);
  }
  return item[column.name];
}
