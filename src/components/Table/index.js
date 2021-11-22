import React from 'react';
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
    const [page, setPage] = React.useState(0);
    const [row, setRow] = React.useState(data.slice(0, 25));
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        setRow(data.slice(newPage * 25, (newPage + 1) * 25))
    }
    return (
        <React.Fragment>
            <div className={`invoice--table ${data.length == 0 ? "" : "visible"}` }>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><span>Issuer Account<SortTableHead /></span></TableCell>
                            <TableCell><span>Issuer KYC<SortTableHead /></span></TableCell>
                            <TableCell><span>Accountname<SortTableHead /></span></TableCell>
                            <TableCell><span>Token Currency Code<SortTableHead /></span></TableCell>
                            <TableCell><span>Total issued value of this token<SortTableHead /></span></TableCell>
                            <TableCell><span>Number of TrustLines<SortTableHead /></span></TableCell>
                            <TableCell><span>Current Dex Offers<SortTableHead /></span></TableCell>
                            <TableCell><span>Trustline<SortTableHead /></span></TableCell>
                            <TableCell><span>Dex<SortTableHead /></span></TableCell>
                            <TableCell><span>Explorers<SortTableHead /></span></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {row.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                    {row.account}
                                </TableCell>
                                <TableCell>
                                    {row.kyc && <CheckCircleIcon style={{color: "green"}} />}
                                </TableCell>
                                <TableCell>
                                    {row.username}
                                </TableCell>
                                <TableCell>
                                    {row.currency}
                                </TableCell>
                                <TableCell>
                                    {row.amount}
                                </TableCell>
                                <TableCell>
                                    {row.trustlines}
                                </TableCell>
                                <TableCell>
                                    {row.offers}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="invoice--table--pagination">
                    <TablePagination
                        labelRowsPerPage=""
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={data.length}
                        rowsPerPage={10}
                        page={page}
                        onPageChange={handleChangePage}
                    />
                    {/* <span className="left-page">
                        page {page + 1} of {data.length % 5 == 0 ? (data.length == 0 ? 1 : Math.floor(data.length / 5)) : Math.floor(data.length / 5 + 1)}
                    </span> */}
                </div>
            </div>
            { isloading && <Spinner type={1} />}
        </React.Fragment>
        
    )
}

export default InvoiceTable;

