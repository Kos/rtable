import { PureComponent } from "react";
import PropTypes from "prop-types";
export { URLQueryStorage } from "./queryStorage";

export class RTable extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      items: [],
      pagination: {},
      query: {},
    };

    this.updateQuery = this.updateQuery.bind(this);
  }

  async componentDidMount() {
    const { queryStorage } = this.props;
    const query = await queryStorage.get();
    // TODO handle rejection of queryStorage?
    this.runQuery(query);
  }

  async runQuery(query) {
    const { dataSource, queryStorage } = this.props;
    this.setState({ query, isLoading: true });
    const { items, pagination } = await dataSource(query);
    this.setState({ query, items, pagination });
    await queryStorage.set(query);
    // TODO handle rejection of dataSource (error boundary?)
    // TODO handle multiple concurrent runQuery calls, note how isLoading could get funny, also how about .cancel() on data source promise
  }

  updateQuery(ups) {
    const newQuery = Object.assign({}, this.state.query, ups);
    this.runQuery(newQuery);
  }

  render() {
    const { isLoading, items, pagination, query } = this.state;
    const { children } = this.props;
    const { updateQuery } = this;
    return children({
      isLoading,
      items,
      pagination,
      query,
      updateQuery,
    });
  }
}

const queryStorageType = PropTypes.object; // TODO
const dataSourceType = PropTypes.func; // TODO

RTable.propTypes = {
  children: PropTypes.func.isRequired,
  queryStorage: queryStorageType.isRequired,
  dataSource: dataSourceType.isRequired,
};
