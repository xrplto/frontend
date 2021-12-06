import React, { useEffect, useState } from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import TablePagination from '@material-ui/core/TablePagination';
import Spinner from "components/spinner"
import "./style.scss"

const SortTableHead = (props) => {
    return (
        <div className="sort-icon">
            <ArrowDropUpIcon /><ArrowDropDownIcon className="sort-icon--down" />
        </div>
    );
}

const InvoiceTable = ({ data, isloading }) => {
    const [page, setPage] = useState(0);
    const [items, setItems] = useState(10)
    // const [row, setRow] = useState([...data.slice(0, items)]);
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    }
    const handleChangeRowsPerPage = (event) => {
        setItems( e => event.target.value)
    }
    // useEffect(() => {
    //     setRow([...data.slice(page * items, (page + 1) * items)])
    // }, [page, items]);

    return (
        <React.Fragment>
            <div className={`invoice--table ${data.length == 0 ? "" : "visible"}` }>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><span>Account<SortTableHead /></span></TableCell>
                            {/* <TableCell><span>Issuer KYC<SortTableHead /></span></TableCell>
                            <TableCell><span>Accountname<SortTableHead /></span></TableCell> */}
                            <TableCell><span>Currency<SortTableHead /></span></TableCell>
                            <TableCell><span>Value<SortTableHead /></span></TableCell>
                            <TableCell><span>TrustLines<SortTableHead /></span></TableCell>
                            <TableCell><span>Offers<SortTableHead /></span></TableCell>
                            {/* <TableCell>Trustline</TableCell>
                            <TableCell>Dex</TableCell> */}
                            <TableCell>Explorers</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.keys(data).map((key, index) => (
                            <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                    {data[key].account}
                                </TableCell>
                                {/* <TableCell>
                                    {row.kyc && <CheckCircleIcon style={{color: "green"}} />}
                                </TableCell>
                                <TableCell>
                                    {row.username}
                                </TableCell> */}
                                <TableCell>
                                    {data[key].currency}
                                </TableCell>
                                <TableCell>
                                    {data[key].amount}
                                </TableCell>
                                <TableCell>
                                    {data[key].trustlines}
                                </TableCell>
                                <TableCell>
                                    {data[key].offers}
                                </TableCell>
                                <TableCell>
                                    <a href={`https://bithomp.com/explorer/${data[key].account}`}>Bithomp</a>&nbsp;|&nbsp; 
                                    <a href={`https://xrpscan.com/account/${data[key].account}`}>XRPScan</a>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {/* <div className="invoice--table--pagination">
                    <TablePagination
                        labelRowsPerPage="Rows per page"
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={data.length}
                        rowsPerPage={items}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </div> */}
            </div>
            { isloading && <Spinner type={1} />}
        </React.Fragment>
        
    )
}

export default InvoiceTable;

