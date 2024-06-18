import React, { useState } from "react";
import {
    useTheme,
    Box,
    Container,
    Stack,
    Grid,
    Card,
    CardContent,
    Tabs,
    Tab,
    Chip,
    Avatar,
    Typography,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    Radio,
    RadioGroup,
    FormControlLabel,
    IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import styled from '@emotion/styled';
import { getHashIcon } from 'src/utils/extra';
import TrustLines from "./TrustLines";
import Offer from "./Offer";
import { TabContext, TabPanel } from "@mui/lab";
import NFTs from "./NFTs";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const OverviewWrapper = styled(Box)(({ theme }) => `
    // overflow: hidden;
    flex: 1;
`);

const Balance = styled("div")(() => `
    font-size: 20px;
    color: #fff;
`);

const OverviewBox = styled(Box)(({ theme }) => ({
    padding: '16px',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
}));

const OverviewItem = styled(Box)({
    textAlign: 'center',
});

const ButtonFollow = styled(Button)(({ theme }) => ({
    border: `1px solid ${theme.colors?.secondary.main}`,
    color: "white",
    '&:hover': {
        backgroundColor: theme.colors?.alpha.white[30],
    }
}));

const ButtonWatch = styled(Button)(({ theme }) => ({
    border: `1px solid ${theme.colors?.primary.main}`,
    color: "white",
    '&:hover': {
        backgroundColor: theme.colors?.alpha.white[30],
    }
}));

const tradesData = [
    { id: 1, type: 'Swap', asset: 'XRP/ETH', amount: '100 XRP', date: '2024-06-01', hash: 'abcdef1234567890' },
    { id: 2, type: 'Buy NFT', asset: 'Dragon NFT', amount: '200 XRP', date: '2024-06-02', hash: '1234567890abcdef' },
    { id: 3, type: 'Swap', asset: 'XRP/BTC', amount: '50 XRP', date: '2024-06-03', hash: '0987654321fedcba' },
    { id: 4, type: 'Buy NFT', asset: 'Space NFT', amount: '150 XRP', date: '2024-06-04', hash: 'fedcba0987654321' },
    { id: 5, type: 'Swap', asset: 'XRP/USDT', amount: '300 XRP', date: '2024-06-05', hash: '0abcdef123456789' }
];

const volumeData = {
    labels: ['June 1', 'June 2', 'June 3', 'June 4', 'June 5', 'June 6', 'June 7'],
    datasets: [
        {
            label: 'Token Volume',
            data: [100, 150, 200, 250, 300, 350, 400],
            fill: false,
            backgroundColor: 'rgba(75,192,192,0.2)',
            borderColor: 'rgba(75,192,192,1)',
        },
        {
            label: 'NFT Volume',
            data: [50, 100, 150, 200, 250, 300, 350],
            fill: false,
            backgroundColor: 'rgba(255,99,132,0.2)',
            borderColor: 'rgba(255,99,132,1)',
        },
    ],
};

const volumeOptions = {
    scales: {
        x: {
            type: 'category',
            beginAtZero: true,
        },
        y: {
            type: 'linear',
            beginAtZero: true,
        },
    },
};

function truncateAccount(str, length = 5) {
    if (!str) return '';
    return str.slice(0, length) + '...' + str.slice(length * -1);
}

export default function Portfolio() {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState("0");
    const [filter, setFilter] = useState('All');

    const handleChange = (_, newValue) => {
        setActiveTab(newValue);
    };

    const handleFilterChange = (event) => {
        setFilter(event.target.value);
    };

    const filteredTrades = tradesData.filter((trade) => {
        if (filter === 'All') return true;
        if (filter === 'Tokens' && trade.type === 'Swap') return true;
        if (filter === 'NFTs' && trade.type === 'Buy NFT') return true;
        return false;
    });

    return (
        <OverviewWrapper>
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Grid container spacing={2}>
                    <Grid item md={4} xs={12}>
                        <Stack sx={{ height: "100%", justifyContent: "space-between" }}>
                            <Stack
                                sx={{
                                    borderRadius: "10px",
                                    p: 2,
                                    bgcolor: theme.palette.background.paper,
                                    color: theme.palette.text.primary,
                                    flex: "1 1 auto",
                                    mb: 2
                                }}
                                spacing={2}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        bgcolor: theme.palette.background.default,
                                        p: 1,
                                        borderRadius: '8px',
                                        border: `1px solid ${theme.palette.divider}`
                                    }}
                                >
                                    <Chip
                                        avatar={<Avatar src={getHashIcon("rf8NFCN8U5grHbvnAvAwihwubudCMBiM93")} />}
                                        label={("rf8NFCN8U5grHbvnAvAwihwubudCMBiM93")}
                                        color="secondary"
                                        sx={{ fontSize: "1rem", color: theme.palette.text.primary }}
                                    />
                                </Box>

                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ color: theme.palette.text.primary, mb: 1 }} variant="h6">Total Balance</Typography>
                                    <Balance>215,438.97897 <span>XRP</span></Balance>
                                    <Typography sx={{ color: theme.palette.text.primary, mt: 1 }} variant="h4">$109,325.8132</Typography>
                                </Box>

                                <Box sx={{ mt: 2 }}>
                                    <Line data={volumeData} options={volumeOptions} />
                                </Box>

                                <ButtonFollow variant="outlined" sx={{ mt: 2 }}>Send</ButtonFollow>
                                <ButtonWatch variant="outlined" sx={{ mt: 2 }}>Receive</ButtonWatch>
                                <ButtonWatch variant="outlined" sx={{ mt: 2 }}>Watch</ButtonWatch>
                            </Stack>

                            <Accordion
                                sx={{
                                    borderRadius: "10px",
                                    '&.Mui-expanded': {
                                        mt: 3
                                    },
                                    flex: "0 0 auto",
                                    bgcolor: theme.palette.background.paper,
                                    color: theme.palette.text.primary,
                                    border: `1px solid ${theme.palette.divider}`
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.text.primary }} />}
                                    aria-controls="panel1d-content" id="panel1d-header"
                                    sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
                                >
                                    WatchList
                                </AccordionSummary>
                                <AccordionDetails sx={{ color: theme.palette.text.primary }}>

                                </AccordionDetails>
                            </Accordion>

                            <Offer />
                        </Stack>
                    </Grid>

                    <Grid item md={8} xs={12}>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Card>
                                    <CardContent>
                                        <Typography sx={{ color: theme.palette.text.primary }} variant="h6">1W PnL Beta</Typography>
                                        <Typography sx={{ color: theme.palette.success.main }} variant="h5">+$7,436.57</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={4}>
                                <Card>
                                    <CardContent>
                                        <Typography sx={{ color: theme.palette.text.primary }} variant="h6">1W Volume</Typography>
                                        <Typography sx={{ color: theme.palette.text.primary }} variant="h5">$304,889.84</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={4}>
                                <Card>
                                    <CardContent>
                                        <Typography sx={{ color: theme.palette.text.primary }} variant="h6">1W Trades</Typography>
                                        <Typography sx={{ color: theme.palette.text.primary }} variant="h5">126</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Card sx={{ flex: 1, mt: 2, mb: 2, bgcolor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                            <CardContent sx={{ px: 0 }}>
                                <TabContext value={activeTab}>
                                    <Box>
                                        <Tabs value={activeTab} onChange={handleChange} aria-label="wrapped label tabs example">
                                            <Tab label="Tokens" value="0" />
                                            <Tab label="NFTs" value="1" />
                                        </Tabs>
                                    </Box>

                                    <TabPanel sx={{ p: 0 }} value="0">
                                        <Paper sx={{ width: '100%', overflow: 'hidden', bgcolor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ color: theme.palette.text.primary }}>Asset</TableCell>
                                                        <TableCell sx={{ color: theme.palette.text.primary }}>Amount</TableCell>
                                                        <TableCell sx={{ color: theme.palette.text.primary }}>Estimated Value</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell sx={{ color: theme.palette.text.primary, width: '100%' }} colSpan={4}>
                                                            <TrustLines account="rf8NFCN8U5grHbvnAvAwihwubudCMBiM93" />
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Paper>
                                    </TabPanel>
                                    <TabPanel sx={{ p: 0 }} value="1">
                                        <Paper sx={{ width: '100%', overflow: 'hidden', bgcolor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell sx={{ width: '100%' }} colSpan={4}>
                                                            <NFTs account="rBRAD8Qd3E6fzgFQKpnA4C1JhgnwgbJ6Cs" />
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Paper>
                                    </TabPanel>
                                </TabContext>
                            </CardContent>
                        </Card>

                        <Box>
                            <Typography sx={{ color: theme.palette.text.primary, mb: 2 }} variant="h6">Historical Trades</Typography>
                            <RadioGroup
                                row
                                value={filter}
                                onChange={handleFilterChange}
                                sx={{ mb: 2, color: theme.palette.text.primary }}
                            >
                                <FormControlLabel value="All" control={<Radio sx={{ color: theme.palette.text.primary }} />} label="All" />
                                <FormControlLabel value="Tokens" control={<Radio sx={{ color: theme.palette.text.primary }} />} label="Tokens" />
                                <FormControlLabel value="NFTs" control={<Radio sx={{ color: theme.palette.text.primary }} />} label="NFTs" />
                            </RadioGroup>
                            <Paper sx={{ width: '100%', overflow: 'hidden', bgcolor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: theme.palette.text.primary }}>Type</TableCell>
                                            <TableCell sx={{ color: theme.palette.text.primary }}>Asset</TableCell>
                                            <TableCell sx={{ color: theme.palette.text.primary }}>Amount</TableCell>
                                            <TableCell sx={{ color: theme.palette.text.primary }}>Date</TableCell>
                                            <TableCell sx={{ color: theme.palette.text.primary }}></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredTrades.map((trade) => (
                                            <TableRow key={trade.id}>
                                                <TableCell sx={{ color: theme.palette.text.primary }}>{trade.type}</TableCell>
                                                <TableCell sx={{ color: theme.palette.text.primary }}>{trade.asset}</TableCell>
                                                <TableCell sx={{ color: theme.palette.text.primary }}>{trade.amount}</TableCell>
                                                <TableCell sx={{ color: theme.palette.text.primary }}>{trade.date}</TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        component="a"
                                                        href={`https://bithomp.com/explorer/${trade.hash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ color: theme.palette.text.primary }}
                                                    >
                                                        <LinkIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </OverviewWrapper>
    );
}
