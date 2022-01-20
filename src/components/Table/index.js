import React, { useEffect, useState } from 'react';
import axios from "axios";
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

const price_change = () => {
    let k = Math.random() * 100 -50
    return k > 0 ? <b className='percent'><ArrowDropUpIcon/> {(k / 10).toFixed(2)} %</b>  : <b className='percent' style={{color: "red"}}><ArrowDropDownIcon/> {(k / 10).toFixed(2)} %</b> 
}

const InvoiceTable = ({ data }) => {
    const [page, setPage] = useState(0);
    const [items, setItems] = useState(100)
    const [row, setRow] = useState({data: [], count: 0});
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    }
    const handleChangeRowsPerPage = (event) => {
        setItems( e => event.target.value)
    }
    useEffect(() => {
        const interval = setInterval(() => {           
            axios.get(`/api/tokens?page=${page}&pagination=${items}`).then(({data}) => {
                setRow(data);
              })
          }, 300000);
          return () => clearInterval(interval);        
      }, [])
    useEffect(() => {
        axios.get(`/api/tokens?page=${page}&pagination=${items}`).then(({data}) => {
            setRow(data);
        })
    }, [page, items]);
    return (
        <React.Fragment>
            <div className="invoice--table visible">
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
                        {row.data.map((item, index) => (
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
                                    $ {item.price? (item.price / 1000000 * row.price.value.$numberDecimal).toFixed(6) : ""}<br/>
                                    {(item.price / 1000000).toFixed(6)} XRP
                                </TableCell>
                                <TableCell>
                                    {price_change()}
                                </TableCell>
                                <TableCell>
                                   {price_change()}    
                                </TableCell>
                                <TableCell>
                                    $ {new Intl.NumberFormat().format((parseFloat(item.amount.$numberDecimal) * row.price.value.$numberDecimal).toFixed())}<br/>
                                    {new Intl.NumberFormat().format(parseFloat(item.amount.$numberDecimal).toFixed())} XRP
                                </TableCell>
                                <TableCell>
                                    <div className="flex agling-items">
                                        <LineChart width={150} height={60} data={chartData()}>
                                            <Line type="monotone" dataKey="pv" stroke={Math.random() > 0.5 ? "green" : "red" } strokeWidth={2} dot={<span />} />
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
                        count={row.count}
                        rowsPerPage={items}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </div>
            </div>
        </React.Fragment>
        
    )
}

export default InvoiceTable;

