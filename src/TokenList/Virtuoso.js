import { TableVirtuoso } from 'react-virtuoso'
import { generateUsers } from './data'
import React from 'react'

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';

// Components
import TokenListHead from './TokenListHead';
import TokenRow from './TokenRow';

export default function Virtuoso({tokens, order, orderBy, onRequestSort, admin, setEditToken, setTrustToken}) {
    return (
        <TableVirtuoso
            style={{ height: 400 }}
            data={tokens}
            components={{
                Scroller: React.forwardRef((props, ref) => <TableContainer component={Paper} {...props} ref={ref} />),
                Table: (props) => <Table {...props} style={{ borderCollapse: 'separate' }} />,
                TableHead: TableHead,
                TableRow: TableRow,
                TableBody: React.forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
            }}
            fixedHeaderContent={() => (
                <TokenListHead
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={onRequestSort}
                />
                // <TableRow>
                //     <TableCell style={{ width: 150, background: 'white' }}>
                //         Name
                //     </TableCell>
                //     <TableCell style={{ background: 'white' }}>
                //         Description
                //     </TableCell>
                // </TableRow>
            )}
            itemContent={(index, row) => (
                <TokenRow
                    key={index}
                    token={row}
                    admin={admin}
                    setEditToken={setEditToken}
                    setTrustToken={setTrustToken}
                />
                // <>
                //     <TableCell style={{ width: 150, background: 'white' }}>
                //         {user.name}
                //     </TableCell>
                //     <TableCell style={{ background: 'white'  }}>
                //         {user.description}
                //     </TableCell>
                // </>
            )}
        />
    )
}
