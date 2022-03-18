//import { useState } from 'react';
import { withStyles } from '@mui/styles';

import { Icon } from '@iconify/react';
import caretDown from '@iconify/icons-bx/caret-down';
//import caretUp from '@iconify/icons-bx/caret-up';

import { fNumber } from '../../../utils/formatNumber';

import {
    Button,
    Divider,
    Stack,
    Typography
} from '@mui/material';

const ActionButton = withStyles({
    root: {
      backgroundColor: "#007B55"
    }
})(Button);

const HoldersTypography = withStyles({
    root: {
        color: "#3366FF"
    }
}) (Typography);

const OffersTypography = withStyles({
    root: {
        color: "#FF6C40"
    }
})(Typography);

export default function TokenDetail({token}) {

    const {
        name,
        holders,
        offers,
        /*
        id
        acct,
        code,
        date,
        amt,
        trline,
        exch*/
    } = token;
  
    let user = token.user;
    if (!user) user = name;

    return (
        <Stack spacing={5}>
            <Stack direction="row" spacing={1} alignItems='start' justify="top">
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                Buy
                </ActionButton>
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                Exchange
                </ActionButton>
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                Gaming
                </ActionButton>
                <ActionButton variant="contained" endIcon={<Icon icon={caretDown} width="16" height="16" />}>
                Earn Crypto
                </ActionButton>
            </Stack>
            <Divider orientation="horizontal" variant="middle" flexItem />
            <Stack direction="row" spacing={5}>
                <Stack spacing={1} alignItems='center'>
                <Typography variant="h6">
                    Holders
                </Typography>
                <HoldersTypography variant="h5">
                {fNumber(holders)}
                </HoldersTypography>
                </Stack>
                <Stack spacing={1} alignItems='center'>
                <Typography variant="h6">
                    Offers
                </Typography>
                <OffersTypography variant="h5">
                {fNumber(offers)}
                </OffersTypography>
                </Stack>
            </Stack>
        </Stack>
    );
}
