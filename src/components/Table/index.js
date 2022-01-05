import React, { useEffect, useState } from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import TablePagination from '@material-ui/core/TablePagination';
import { LineChart, Line } from "recharts";
import Dropdown from "components/dropdown";
import Spinner from "components/spinner";
import {
    Link
  } from "react-router-dom";
import "./style.scss"


const SortTableHead = (props) => {
    return (
        <div className="sort-icon">
            <ArrowDropUpIcon /><ArrowDropDownIcon className="sort-icon--down" />
        </div>
    );
}
const chartData = () => {
    let k = []
    for(let i=0; i < 20; i++) {
        k.push({ pv: 0.05 * i + Math.random() })
    }
    return k;
}

const InvoiceTable = ({ data, isloading }) => {
    const [page, setPage] = useState(0);
    const [items, setItems] = useState(100)
    const [row, setRow] = useState([...data.slice(0, items)]);
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    }
    const handleChangeRowsPerPage = (event) => {
        setItems( e => event.target.value)
    }
    useEffect(() => {
        setRow([...data.slice(page * items, (page + 1) * items)])
    }, [page, items, data]);
    console.log(row)
    return (
        <React.Fragment>
            <div className={`invoice--table ${data.length === 0 ? "" : "visible"}` }>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><span>#<SortTableHead /></span></TableCell>
                            <TableCell><span>NAME<SortTableHead /></span></TableCell>
                            <TableCell><span>PRICE<SortTableHead /></span></TableCell>
                            {/* <TableCell><span>Issuer KYC<SortTableHead /></span></TableCell>
                            <TableCell><span>Accountname<SortTableHead /></span></TableCell> */}                            
                            <TableCell><span>24H<SortTableHead /></span></TableCell>
                            <TableCell><span>7D<SortTableHead /></span></TableCell>
                            <TableCell><span>Circulating Supply<SortTableHead /></span></TableCell>
                            {/* <TableCell>Trustline</TableCell>
                            <TableCell>Dex</TableCell> */}
                            <TableCell>Last 7 Days</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {row.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    {page * items + index + 1}
                                </TableCell>
                                <TableCell>
                                    <Link to={`/tokens/${item._id}`}>{item.username == ""? item.currency : item.username}</Link>
                                </TableCell>
                                {/* <TableCell component="th" scope="row">
                                    {item.account}
                                </TableCell> */}
                                {/* <TableCell>
                                    {row.kyc && <CheckCircleIcon style={{color: "green"}} />}
                                </TableCell>
                                <TableCell>
                                    {row.username}
                                </TableCell> */}
                                <TableCell>
                                    {item.trustlines}
                                </TableCell>
                                <TableCell>
                                    {item.offers}
                                </TableCell>
                                <TableCell>
                                    {item.offers}
                                </TableCell>
                                <TableCell>
                                    {parseFloat(item.amount.$numberDecimal).toFixed()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex agling-items">
                                        <LineChart width={150} height={60} data={chartData()}>
                                            <Line type="monotone" dataKey="pv" stroke="#5ecf8e" strokeWidth={2} dot={<span />} />
                                        </LineChart>                
                                        <Dropdown account={item.account} />                          
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="invoice--table--pagination">
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
                </div>
            </div>
            { isloading && <Spinner type={1} />}
        </React.Fragment>
        
    )
}

export default InvoiceTable;

