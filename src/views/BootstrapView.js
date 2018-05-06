import React, { PureComponent } from "react";

export default class BootstrapView extends PureComponent {
  render() {
    const { columns, items } = this.props;

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
            <td colSpan={columns.length}>Hello</td>
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
