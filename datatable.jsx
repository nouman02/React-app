import * as _ from "lodash";
import {TableHead} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import {withStyles} from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import PropTypes from "prop-types";
import React, {useEffect} from "react";
import Grid from "@material-ui/core/Grid";

import IconButton from "@material-ui/core/IconButton";
import FirstPageIcon from "@material-ui/icons/FirstPage";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import LastPageIcon from "@material-ui/icons/LastPage";
import TableFooter from "@material-ui/core/TableFooter";
import TablePagination from "@material-ui/core/TablePagination";

const styles = theme => ({
  root: {
    width: "100%",
    marginTop: theme.spacing.unit,
    minWidth: 1050
  },
  paper: {
    padding: `${theme.spacing.unit} ${theme.spacing.unit}`,
    textAlign: "center",
    color: theme.palette.text.secondary
  },
  table: {
    minWidth: 1000
  },
  tableWrapper: {
    overflowX: "auto"
  }
});

function TablePaginationActions(props) {
  const { count, page, rowsPerPage, onChangePage } = props;

  function handleFirstPageButtonClick(event) {
    onChangePage(event, 0);
  }

  function handleBackButtonClick(event) {
    onChangePage(event, page - 1);
  }

  function handleNextButtonClick(event) {
    onChangePage(event, page + 1);
  }

  function handleLastPageButtonClick(event) {
    onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  }

  return (
    <Grid container>
      <Grid xs={2} item>
        <IconButton
          onClick={handleFirstPageButtonClick}
          disabled={page === 0}
          aria-label="First Page"
        >
          {<FirstPageIcon />}
        </IconButton>
      </Grid>
      <Grid xs={2} item>
        <IconButton
          onClick={handleBackButtonClick}
          disabled={page === 0}
          aria-label="Previous Page"
        >
          {<KeyboardArrowLeft />}
        </IconButton>
      </Grid>
      <Grid xs={2} item>
        <IconButton
          onClick={handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Next Page"
        >
          {<KeyboardArrowRight />}
        </IconButton>
      </Grid>
      <Grid xs={2} item>
        <IconButton
          onClick={handleLastPageButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Last Page"
        >
          {<LastPageIcon />}
        </IconButton>
      </Grid>
    </Grid>
  );
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired
};

const DataTable = props => {
  const [page, setPage] = React.useState(props.page);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const { data, columns, title, classes, onChangePage } = props;
  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

  function handleChangePage(event, newPage) {
    setPage(newPage);
    onChangePage(event, newPage);
  }

  function handleChangeRowsPerPage(event) {
    setRowsPerPage(parseInt(event.target.value, 10));
  }

  let table;
  const parsedData = data.map((d, idx) => {
    if (d && typeof d === "object") {
      return d;
    }

    return {
      [idx]: d
    };
  });

  useEffect(() => {
      if (props.page !== page) {
        setPage(props.page);
      }
  }, [page, props]);

  const createTableRow = rows => {
    const picked = columns.map(c => ({ name: c.name, label: c.label }));
    const cherryPicker = (index, row) => {
      return picked.map((key, pidx) => {
        const found = _.find(columns, {name: key.name, label: key.label});

        if (found) {
          const tableMeta = {
            columnNames: picked,
            data: rows,
            rowIndex: index
          };
          const customBodyRender = found.options.customBodyRender;

          if (customBodyRender && typeof customBodyRender === "function") {
            return (
              <TableCell
                key={`cell_${pidx}`}
                align={found.options.alignRow || "left"}
              >
                {customBodyRender(row[found.name], tableMeta)}
              </TableCell>
            );
          }

          return <TableCell key={`cell_m_${index}`}>{row[index]}</TableCell>;
        }
        return null;
      });
    };
    const d = rows

      .map((row, idx) => {
        return <TableRow key={`row-${idx}`}>{cherryPicker(idx, row)}</TableRow>;
      })
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    return d;
  };

  const mappedColumns = columns.map((column, idx) => {
    let width;
    switch (column.options.size) {
      case "small":
        width = 200;
        break;
      case "long":
        width = 400;
        break;
      case "normal":
        width = 250;
        break;
      case "medium":
      case "md":
        width = 300;
        break;
      default:
        width = column.options.size || 250;
        break;
    }

    return (
      <TableCell
        style={{ width: width }}
        align={column.options.alignColumns || "left"}
        key={`column_${column.name}-${idx}`}
      >
        {column.label}
      </TableCell>
    );
  });

  table = (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>{mappedColumns}</TableRow>
      </TableHead>
      <TableBody>
        {createTableRow(parsedData)}
        {emptyRows > 0 && (
          <TableRow>
            <TableCell colSpan={6} />
          </TableRow>
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            colSpan={3}
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            SelectProps={{
              inputProps: { "aria-label": "Rows per page" },
              native: true
            }}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            ActionsComponent={TablePaginationActions}
          />
        </TableRow>
      </TableFooter>
    </Table>
  );
  return (
    <Grid container className={classes.root}>
      <Grid item xs={12}>
        <Paper className={classes.paper}>
          <Grid item xs={12}>
            {title !== "" && title !== null ? <h4>{title} </h4> : null}
          </Grid>
          <Grid item xs={12}> {table} </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

DataTable.propTypes = {
  classes: PropTypes.object,
  page: PropTypes.number,
  data: PropTypes.array,
  title: PropTypes.string,
  options: PropTypes.object,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string,
      customBodyRenderer: PropTypes.func,
      value: PropTypes.string,
      options: PropTypes.shape({
        filter: PropTypes.bool,
        sort: PropTypes.bool
      })
    })
  ).isRequired,
  onChangePage: PropTypes.func,
  loading: PropTypes.bool,
  loadingIndicatorType: PropTypes.string
};

DataTable.defaultProps = {
  title: "Untitled Table",
  options: {},
  headers: [],
  data: [],
  page: 0,
  columns: [],
  loading: true,
  loadingIndicatorType: "spinner"
};

export default withStyles(styles)(DataTable);
