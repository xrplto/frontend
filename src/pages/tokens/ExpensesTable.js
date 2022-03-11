import React, { useContext } from 'react';
import { makeStyles } from "@mui/styles";
import Title from './Title';
import moment from 'moment';
//import { DataContext } from '../Providers/DataProvider';

import {
  Table,
  Link,
  TableRow,
  TableBody,
  TableCell,
  TableHead
} from '@mui/material';

function preventDefault(event) {
  event.preventDefault();
}

const useStyles = makeStyles(theme => ({
  seeMore: {
    marginTop: theme.spacing(3),
  },
}));

export default function ExpensesTable() {
    const classes = useStyles();
    //const { data } = useContext(DataContext);
    //const rows = Object.values(data);
    const rows = JSON.parse('[{"id":540,"date":1647021233359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":-645.16},{"id":861,"date":1647107633359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":837.32},{"id":658,"date":1647190433359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":1369.97},{"id":921,"date":1647276833359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":-184.67},{"id":32,"date":1647363233359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":-752.9},{"id":728,"date":1647449633359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":224.93},{"id":514,"date":1647536033359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":1066.22},{"id":116,"date":1647622433359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":1846.37},{"id":392,"date":1647708833359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":-453.08},{"id":315,"date":1647795233359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":-3.81},{"id":24,"date":1647881633359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":249.85},{"id":729,"date":1647968033359,"name":"Added Random","shipTo":"Location","paymentMethod":"Payment","amount":272.24}]');
    return (
        <React.Fragment>
            <Title>Recent Orders</Title>
            <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>{moment(row.date).format('MM/DD/YYYY')}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.shipTo}</TableCell>
                      <TableCell>{row.paymentMethod}</TableCell>
                      <TableCell align="right">
                        ${row.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
            <div className={classes.seeMore}>
              <Link color="primary" href="#" onClick={preventDefault}>
                See more orders
              </Link>
            </div>
        </React.Fragment>
    );
}
