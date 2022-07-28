import React from 'react';
import PropTypes from 'prop-types';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import classNames from 'classnames';
import { makeStyles, useTheme } from '@mui/styles';
import Draggable from 'react-draggable';
import { calcColumnWidth } from './utils';

// Material
import {
    Table,
    TableCell,
    TableSortLabel
} from '@mui/material';

const FOOTER_BORDER_HEIGHT = 1;

const useStyles = makeStyles(theme => ({
    table: {
        boxSizing: 'border-box',

        '& .topLeftGrid': {
            // backgroundColor: theme.palette.grey[theme.palette.type === 'dark' ? 800 : 200],
            // borderBottom: `2px solid ${theme.palette.divider}`,
            // borderRight: `2px solid ${theme.palette.divider}`,
            // color: theme.palette.text.secondary,
            // fontSize: theme.typography.pxToRem(12),

            // Hide scrollbars on Chrome/Safari/IE
            '&::-webkit-scrollbar': {
                display: 'none'
            },
            '-ms-overflow-style': 'none'
        },

        '& .topRightGrid': {
            // backgroundColor: theme.palette.grey[theme.palette.type === 'dark' ? 800 : 200],
            // borderBottom: `2px solid ${theme.palette.divider}`,
            // color: theme.palette.text.secondary,
            // fontSize: theme.typography.pxToRem(12),

            // Hide scrollbars on Chrome/Safari/IE
            '&::-webkit-scrollbar': {
                display: 'none'
            },
            '-ms-overflow-style': 'none'
        },

        '& .bottomLeftGrid': {
            // backgroundColor: theme.palette.grey[theme.palette.type === 'dark' ? 800 : 200],
            // borderRight: `2px solid ${theme.palette.divider}`,
            // color: theme.palette.text.secondary,
            // fontSize: theme.typography.pxToRem(13),

            // Hide scrollbars on Chrome/Safari/IE
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            '-ms-overflow-style': 'none'
        },
        
        '& .bottomRightGrid': {
            // color: theme.palette.text.primary,
            // fontSize: theme.typography.pxToRem(13),
            outline: 'none' // See: https://github.com/bvaughn/react-virtualized/issues/381
        }
    },
    cell: {
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center'
    },
    cellClickable: {
        cursor: 'pointer'
    },
    cellSelected: {
        backgroundColor:
            theme.palette.grey[theme.palette.type === 'dark' ? 900 : 100]
    },
    cellHovered: {
        backgroundColor:
            theme.palette.grey[theme.palette.type === 'dark' ? 800 : 200]
    },
    cellDisabled: {
        opacity: 0.5
    },
    cellContents: {
        width: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    cellHeader: {
        fontSize: theme.typography.pxToRem(12),
        fontWeight: theme.typography.fontWeightMedium,
        color: theme.palette.text.secondary
    },
    cellInLastColumn: {
        paddingRight: theme.spacing(3)
    },
    cellInLastRow: {
        borderBottom: 'none'
    },
    footer: {
        borderTop: `${FOOTER_BORDER_HEIGHT}px solid ${theme.palette.divider}`
    },
    dragHandle: {
        flex: '0 0 16px',
        zIndex: 2,
        cursor: 'col-resize',
        color: '#0085ff'
    },
    DragHandleActive: {
        color: '#0b6fcc',
        zIndex: 3
    },
    DragHandleIcon: {
        flex: '0 0 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    }
}));

const useCellRenderer = ({
    recomputeGridSize,
    columns,
    width,
    includeHeaders,
    data,
    columnWidth,
    isCellHovered,
    classes,
    orderBy,
    orderDirection,
    onHeaderClick,
    onCellClick,
    onCellDoubleClick,
    onCellContextMenu,
    cellProps: defaultCellProps
}) => {
    const [{ hoveredColumn, hoveredRowData }, setHovered] = React.useState({
        hoveredColumn: null,
        hoveredRowData: null
    });

    const [widths, setWidths] = React.useState([]);

    React.useEffect(() => {
        recomputeGridSize();
    }, [recomputeGridSize, hoveredColumn, hoveredRowData, widths]);

    const getColumnWidth = React.useCallback(
        ({ index }) =>
            calcColumnWidth(index, columns, width),
            [columnWidth, columns, width]
    );

    const handleMouse = React.useCallback(
        (hoveredColumn, hoveredRowData) => e =>
            setHovered({
                hoveredColumn,
                hoveredRowData
            }),
        [setHovered]
    );

    const cellRenderer = ({ columnIndex, rowIndex, key, style }) => {
        const column = columns[columnIndex];
        const isHeader = includeHeaders && rowIndex === 0;
        const headerOffset = includeHeaders ? 1 : 0;
        const rowData = (data && data[rowIndex - headerOffset]) || {};

        const isHovered =
            hoveredColumn &&
            hoveredRowData &&
            isCellHovered &&
            isCellHovered(column, rowData, hoveredColumn, hoveredRowData);

        const resolveCellProps = cellProps =>
            typeof cellProps === 'function'
              ? cellProps(column, rowData, hoveredColumn, hoveredRowData)
              : cellProps;
        // TODO: Deep merge (do not override all defaultCellProps styles if column.cellProps.styles defined?)
        const { style: cellStyle, ...cellProps } = {
            ...resolveCellProps(defaultCellProps),
            ...resolveCellProps(column.cellProps)
        };

        const contents = (
            <div className={classes.cellContents}>
                <span style={{ flex: 'auto' }}>
                    {isHeader
                        ? column.header != null
                        ? column.header
                        : column.name
                        : column.cell
                        ? column.cell(rowData)
                        : rowData[column.name]}
                </span>
            </div>
        );

        const hasCellClick = !isHeader && onCellClick;
        const hasCellDoubleClick = !isHeader && onCellDoubleClick;
        const hasCellContextMenu = !isHeader && onCellContextMenu;
        const isClickable =
            hasCellClick ||
            hasCellDoubleClick ||
            hasCellContextMenu ||
            column.onClick;

        const className = classNames(classes.cell, {
            [classes.cellClickable]: isClickable,
            [classes.cellHovered]: isHovered,
            [classes.cellHeader]: isHeader,
            [classes.cellInLastColumn]: columnIndex === columns.length - 1,
            [classes.cellInLastRow]: !isHeader && rowIndex === (data ? data.length : 0)
        });

        return (
            <TableCell
                component='div'
                className={className}
                key={key}
                onMouseEnter={handleMouse(column, rowData)}
                onMouseLeave={handleMouse(null, null)}
                style={{
                    ...style,
                    ...cellStyle
                }}
                {...(hasCellClick && {
                    onClick: event => onCellClick(event, { column, rowData, data })
                })} // Can be overridden by cellProps.onClick on column definition
                {...(hasCellDoubleClick && {
                    onDoubleClick: event =>
                        onCellDoubleClick(event, { column, rowData, data })
                })} // Can be overridden by cellProps.onDoubleClick on column definition
                {...(hasCellContextMenu && {
                    onContextMenu: event =>
                        onCellContextMenu(event, { column, rowData, data })
                })} // Can be overridden by cellProps.onContextMenu on column definition
                {...cellProps}
            >
                {isHeader &&
                column.onHeaderClick !== false &&
                (column.onHeaderClick || onHeaderClick) ? (
                    <TableSortLabel
                        active={
                        orderBy &&
                        (orderBy === column.name || orderBy === column.orderBy) &&
                        rowIndex === 0
                        }
                        style={{ width: 'inherit' }} // fix text overflowing
                        direction={orderDirection}
                        onClick={event =>
                            column.onHeaderClick
                                ? column.onHeaderClick(event, { column })
                                : onHeaderClick(event, { column })
                        }
                    >
                        {contents}
                    </TableSortLabel>
                ) : (
                  contents
                )}
            </TableCell>
        );
    };

    return { cellRenderer, columnWidth: getColumnWidth };
};

export default function MuiTable({
    data,
    columns,
    width,
    height,
    maxHeight = null,
    fitHeightToRows,
    fixedRowCount = 0,
    fixedColumnCount = 0,
    rowHeight = 56,
    style,
    columnWidth,
    includeHeaders = false,
    isCellHovered,
    classes: Classes,
    orderBy,
    orderDirection,
    onHeaderClick,
    onCellClick,
    onCellDoubleClick,
    onCellContextMenu,
    cellProps,
    ...other
}) {
    const classes = useStyles({ classes: Classes });
    const theme = useTheme();

    const multiGrid = React.useRef(null);

    const recomputeGridSize = React.useCallback(
        () => multiGrid.current && multiGrid.current.recomputeGridSize(),
        [multiGrid]
    );

    React.useEffect(() => {
        recomputeGridSize();
    }, [columns, data, height, width, recomputeGridSize]);

    let calculatedHeight = maxHeight; // 0;

    return (
        <Table
            component='div'
            style={{ width, height: calculatedHeight, ...style }}
            className={classes.table}
            {...other}
        >
            <MultiGrid
                {...useCellRenderer({
                    recomputeGridSize,
                    data,
                    columns,
                    width,
                    classes,
                    includeHeaders,
                    columnWidth,
                    isCellHovered,
                    orderBy,
                    orderDirection,
                    onHeaderClick,
                    onCellClick,
                    onCellDoubleClick,
                    onCellContextMenu,
                    cellProps
                })}
                ref={multiGrid}
                width={width}
                columnCount={Array.isArray(columns) ? columns.length : 0}
                fixedColumnCount={fixedColumnCount}
                enableFixedColumnScroll={fixedColumnCount > 0}
                height={calculatedHeight}
                rowHeight={rowHeight}
                rowCount={
                    Array.isArray(data) ? data.length + (includeHeaders ? 1 : 0) : 0
                }
                fixedRowCount={fixedRowCount}
                enableFixedRowScroll={fixedRowCount > 0}
                // TODO: Read these from `classes` without classes.table inheritance?  How to pass props.classes down to override?
                classNameTopLeftGrid={'topLeftGrid'}
                classNameTopRightGrid={'topRightGrid'}
                classNameBottomLeftGrid={'bottomLeftGrid'}
                classNameBottomRightGrid={'bottomRightGrid'}
            />
        </Table>
    );
}

MuiTable.propTypes = {
    data: PropTypes.array,
    columns: PropTypes.array,
    width: PropTypes.number,
    height: PropTypes.number,
    maxHeight: PropTypes.number,
    fitHeightToRows: PropTypes.bool,
    fixedRowCount: PropTypes.number,
    fixedColumnCount: PropTypes.number,
    rowHeight: PropTypes.number,
    columnWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
    includeHeaders: PropTypes.bool,
    orderBy: PropTypes.string,
    orderDirection: PropTypes.string,
    onHeaderClick: PropTypes.func,
    onCellClick: PropTypes.func,
    onCellDoubleClick: PropTypes.func,
    onCellContextMenu: PropTypes.func,
    noPointer: PropTypes.bool,
    isCellHovered: PropTypes.func,
    classes: PropTypes.object,
    cellProps: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    style: PropTypes.object
};

