import * as React from 'react';
// Material
import { alpha, styled/*, useTheme*/ } from '@mui/material/styles';
import {
    Box,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';
// Components
import { fIntNumber, fCurrency3, fNumber } from '../utils/formatNumber';
import postageStamp from '@iconify/icons-mdi/postage-stamp';
// Redux
import { useSelector } from "react-redux";
import { selectStatus } from "../redux/statusSlice";
// Iconify Icons
import { Icon } from '@iconify/react';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';
// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    borderRadius: '0px',
    //padding: '0.5em'
    //backgroundColor: alpha("#00AB88", 0.99),
}));

const XLS14DStyle = styled('div')(({ theme }) => ({
    cursor: 'pointer',
    paddingLeft: theme.spacing(0.8),
    paddingRight: theme.spacing(0.8),
    paddingTop: theme.spacing(0.2),
    paddingBottom: theme.spacing(0.2),
    boxShadow: theme.customShadows.z20,
    color: theme.palette.text.widget,
    backgroundColor: theme.palette.background.widget,
    borderRadius: 8,
    transition: theme.transitions.create('opacity'),
    opacity: 0.9,
    '&:hover': { opacity: 1 }
}));

const H24Style = styled('div')(({ theme }) => ({
    cursor: 'pointer',
    paddingLeft: theme.spacing(0.8),
    paddingRight: theme.spacing(0.8),
    paddingTop: theme.spacing(0.2),
    paddingBottom: theme.spacing(0.2),
    boxShadow: theme.customShadows.z20,
    color: theme.palette.text.widget,
    backgroundColor: '#0C53B7',
    borderRadius: 8,
    transition: theme.transitions.create('opacity'),
    opacity: 1,
    '&:hover': { opacity: 1 }
}));

const Label = styled('span')(({ theme }) => ({
    fontSize: '0.87rem'
}));
// ----------------------------------------------------------------------

function Rate(num) {
    if (num === 0)
        return 0;
    return fCurrency3(1/num);
}
export default function Topbar() {
    const status = useSelector(selectStatus);

    return (
        <StackStyle direction="row" spacing={2} sx={{pl:2, pr:3, pt:0.5, pb:0.5}} alignItems="center">
                <Label>Tokens: </Label>
                <Label>{fIntNumber(status.token_count)}</Label>
                <H24Style>
                    <Tooltip title="Metrics on 24 hours">
                        <Stack spacing={0.05} alignItems='center'>
                            <Typography align="center" style={{ wordWrap: "break-word" }} variant="caption" >
                                24h
                            </Typography>
                        </Stack>
                    </Tooltip>
                </H24Style>
                <Label>Tx:</Label>
                <Typography align="center" style={{ color: "#74CAFF" }} variant="subtitle2">{fIntNumber(status.transactions24H)}</Typography>
                {/* <Label>|</Label> */}
                <Label>Vol:</Label>
                <Typography align="center" style={{ color: "#FF6C40" }} variant="subtitle2">
                    <Stack direction="row" spacing={0.5} alignItems='center'>
                        <Icon icon={rippleSolid} color="#54D62C"/>
                        <Typography align="center" style={{ color: "#54D62C" }} variant="subtitle2">
                            {fNumber(status.tradedXRP24H)}
                        </Typography>
                    </Stack>
                </Typography>
                {/* <Label>|</Label> */}
                <Label>Tokens Traded:</Label>
                <Typography align="center" style={{ color: "#3366FF" }} variant="subtitle2">{fIntNumber(status.tradedTokens24H)}</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Stack direction="row" spacing={0.5} alignItems='center'>
                    <Icon icon={rippleSolid} width='12' height='12'/>
                    <Typography align="center" variant="subtitle2">1</Typography>
                </Stack>
                <Label>|</Label>
                <Label>$ {Rate(status.USD)}</Label>
                <Label>|</Label>
                <Label>€ {Rate(status.EUR)}</Label>
                <Label>|</Label>
                <Label>¥ {Rate(status.JPY)}</Label>
                <XLS14DStyle>
                    <Tooltip title="Deprecated">
                        <Stack direction="row" spacing={0.1} alignItems='center'>
                            <Icon icon={postageStamp} width={16} height={16} />
                            <Typography align="center" style={{ wordWrap: "break-word" }} variant="caption" >
                                XLS-14D
                            </Typography>
                        </Stack>
                    </Tooltip>
                </XLS14DStyle>
        </StackStyle>
    );
}
