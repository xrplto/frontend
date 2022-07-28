import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { styled } from '@mui/material/styles';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import { AutoSizer, Column, Table } from 'react-virtualized';

const classes = {
    flexContainer: 'ReactVirtualizedDemo-flexContainer',
    tableRow: 'ReactVirtualizedDemo-tableRow',
    tableRowHover: 'ReactVirtualizedDemo-tableRowHover',
    tableCell: 'ReactVirtualizedDemo-tableCell',
    noClick: 'ReactVirtualizedDemo-noClick',
};

const styles = ({ theme }) => ({
    // temporary right-to-left patch, waiting for
    // https://github.com/bvaughn/react-virtualized/issues/454
    '& .ReactVirtualized__Table__headerRow': {
        ...(theme.direction === 'rtl' && {
            paddingLeft: '0 !important',
        }),
        ...(theme.direction !== 'rtl' && {
            paddingRight: undefined,
        }),
    },
    [`& .${classes.flexContainer}`]: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
    },
    [`& .${classes.tableRow}`]: {
        cursor: 'pointer',
    },
    [`& .${classes.tableRowHover}`]: {
        '&:hover': {
            backgroundColor: theme.palette.grey[200],
        },
    },
    [`& .${classes.tableCell}`]: {
        flex: 1,
    },
    [`& .${classes.noClick}`]: {
        cursor: 'initial',
    },
});

class MuiVirtualizedTable extends React.PureComponent {
    static defaultProps = {
        headerHeight: 48,
        rowHeight: 48,
    };

    getRowClassName = ({ index }) => {
        const { onRowClick } = this.props;

        return clsx(classes.tableRow, classes.flexContainer, {
          [classes.tableRowHover]: index !== -1 && onRowClick != null,
        });
    };

    cellRenderer = ({ cellData, columnIndex }) => {
        const { columns, rowHeight, onRowClick } = this.props;
        return (
          <TableCell
              component="div"
              className={clsx(classes.tableCell, classes.flexContainer, {
                  [classes.noClick]: onRowClick == null,
              })}
              variant="body"
              style={{ height: rowHeight }}
              align={
                  (columnIndex != null && columns[columnIndex].numeric) || false
                    ? 'right'
                    : 'left'
              }
          >
              {cellData}
          </TableCell>
        );
    };

    headerRenderer = ({ label, columnIndex }) => {
        const { headerHeight, columns } = this.props;

        return (
            <TableCell
                component="div"
                className={clsx(classes.tableCell, classes.flexContainer, classes.noClick)}
                variant="head"
                style={{ height: headerHeight }}
                align={columns[columnIndex].numeric || false ? 'right' : 'left'}
            >
                <span>{label}</span>
            </TableCell>
        );
    };

    render() {
        const { columns, rowHeight, headerHeight, ...tableProps } = this.props;
        return (
            <AutoSizer>
                {({ height, width }) => (
                    <Table
                        height={height}
                        width={width}
                        rowHeight={rowHeight}
                        gridStyle={{
                          direction: 'inherit',
                        }}
                        headerHeight={headerHeight}
                        {...tableProps}
                        rowClassName={this.getRowClassName}
                    >
                        {columns.map(({ id, ...other }, index) => {
                            return (
                                <Column
                                    key={id}
                                    headerRenderer={(headerProps) =>
                                        this.headerRenderer({
                                            ...headerProps,
                                            columnIndex: index,
                                        })
                                    }
                                    className={classes.flexContainer}
                                    cellRenderer={this.cellRenderer}
                                    dataKey={id}
                                    {...other}
                                />
                            );
                        })}
                    </Table>
                )}
            </AutoSizer>
        );
    }
}

MuiVirtualizedTable.propTypes = {
    headerHeight: PropTypes.number,
    onRowClick: PropTypes.func,
    rowHeight: PropTypes.number,
};

const VirtualizedTable = styled(MuiVirtualizedTable)(styles);

// ---

const sample = [
    ['Frozen yoghurt', 159, 6.0, 24, 4.0],
    ['Ice cream sandwich', 237, 9.0, 37, 4.3],
    ['Eclair', 262, 16.0, 24, 6.0],
    ['Cupcake', 305, 3.7, 67, 4.3],
    ['Gingerbread', 356, 16.0, 49, 3.9],
];

function createData(id, dessert, calories, fat, carbs, protein) {
    return { id, dessert, calories, fat, carbs, protein };
}

const rows = [];

for (let i = 0; i < 200; i += 1) {
    const randomSelection = sample[Math.floor(Math.random() * sample.length)];
    rows.push(createData(i, ...randomSelection));
}

const TABLE_HEAD = [
    { no: 0, id: 'id', label: '#', align: 'left', width: '', order: false },
    { no: 1, id: 'name', label: 'Name', align: 'left', width: '10%', order: true },
    { no: 2, id: 'exch', label: 'Price', align: 'right', width: '8%', order: true },
    { no: 3, id: 'pro24h', label: '24h (%)', align: 'right', width: '6%', order: true },
    { no: 4, id: 'pro7d', label: '7d (%)', align: 'right', width: '6%', order: true },
    { no: 5, id: 'vol24hxrp', label: 'Volume(24h)', align: 'right', width: '10%', order: true },
    { no: 6, id: 'vol24htx', label: 'Trades', align: 'right', width: '6%', order: true },
    { no: 7, id: 'marketcap', label: 'Market Cap', align: 'right', width: '10%', order: true },
    { no: 8, id: 'trustlines', label: 'TrustLines', align: 'right', width: '10%', order: true },
    { no: 9, id: 'amount', label: 'Total Supply', align: 'right', width: '15%', order: true },
    { no: 10, id: 'historyGraph', label: 'Last 7 Days', align: 'right', width: '15%', order: false },
    { id: '' }
];

export default function ReactVirtualizedTable({tokens}) {
    return (
        <div style={{ height: 400, width: '100%' }}>
            <VirtualizedTable
                rowCount={tokens.length}
                rowGetter={({ index }) => tokens[index]}
                columns={TABLE_HEAD}
            />
        </div>
    );
}
