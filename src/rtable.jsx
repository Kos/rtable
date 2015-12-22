
class RTable extends React.Component {
  constructor(props) {
    super(props);
    this.state ={
      rows: []
    };
  }
  componentDidMount() {
    $.get(this.props.dataUrl)
    .then(response => {
      // count, next, previous, results
      this.setState({rows: response.results});
    });
  }
  render() {
    let header = this.props.columns.map((col, n) =>
      <th key={n}>{col.name}</th>
    );
    let rows = this.state.rows.map((row, m) => {
      let cells = this.props.columns.map((col, n) =>
        <td key={n}>{row[col.key]}</td>
      );
      return <tr key={m}>{cells}</tr>;
    });

    return (
      <table>
        <thead>
          <tr>{header}</tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    );
  }
}
