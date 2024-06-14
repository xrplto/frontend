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
    AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import styled from '@emotion/styled';
import { getHashIcon } from 'src/utils/extra';
import TrustLines from "./TrustLines";
import Offer from "./Offer";
import { TabContext, TabPanel } from "@mui/lab";
import NFTs from "./NFTs";

const OverviewWrapper = styled(Box)(({ theme }) => `
    // overflow: hidden;
    flex: 1;
`);

const Balance = styled("div")(() => `
    font-size: 20px;
    color: #fff;
`);

const ButtonFollow = styled(Button)(({ theme }) => ({
    border: `1px solid ${theme.colors?.secondary.main}`,
    color: "white",
    '&:hover': {
        backgroundColor: theme.colors?.alpha.white[30],
    }
}));


function truncateAccount(str, length = 5) {
    if (!str) return '';
    return str.slice(0, length) + '...' + str.slice(length * -1);
}

export default function Portfolio() {

    const theme = useTheme();

    const [activeTab, setActiveTab] = useState("0");

    const handleChange = (_, newValue) => {
        setActiveTab(newValue);
    };    

    return (
        <OverviewWrapper>

            <Container maxWidth="lg" sx={{
                mt: 4
            }}>
                <Grid container spacing={2}>
                    <Grid item md={4} xs={12}>
                        <Stack sx={{ height: "100%" }}>
                            <Stack
                                sx={{
                                    backgroundImage: "linear-gradient(to left, #3b82f6, #1e3a8a)",
                                    borderRadius: "10px",
                                    p: 2
                                }}

                                spacing={2}
                            >

                                <Stack spacing={1} direction="row">
                                    <Chip
                                        avatar={<Avatar src={getHashIcon("rf8NFCN8U5grHbvnAvAwihwubudCMBiM93")}/>}
                                        label={truncateAccount("rf8NFCN8U5grHbvnAvAwihwubudCMBiM93")}
                                        color="info"
                                        sx={{
                                            fontSize: "1rem"
                                        }}
                                    />                                
                                </Stack>

                                <Stack>
                                    <Typography sx={{ color: "#fff" }} variant="h6">Total Balance</Typography>
                                    <Balance>215,438.97897 <span>XRP</span></Balance>
                                    <Typography sx={{ color: "#fff" }} variant="h4">$109,325.8132</Typography>
                                </Stack>

                                <ButtonFollow variant="outlined">Follow</ButtonFollow>
                            </Stack>

                            <Accordion
                                sx={{
                                    mt: 3,
                                    borderRadius: "10px",
                                    '&.Mui-expanded': {
                                        mt: 3
                                    }
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon/>}
                                    aria-controls="panel1d-content" id="panel1d-header"
                                    sx={{
                                        fontWeight: "bold"
                                    }}
                                >
                                    Following
                                </AccordionSummary>
                                <AccordionDetails>

                                </AccordionDetails>
                            </Accordion>

                            <Offer/>

                        </Stack>
                    </Grid>

                    <Grid item md={8} xs={12}>
                        <Card sx={{ height: "100%"}}>
                            <CardContent sx={{ px: 0 }}>
                                <TabContext value={activeTab}>
                                    <Box>
                                        <Tabs value={activeTab} onChange={handleChange} aria-label="wrapped label tabs example">
                                            <Tab label="Tokens" value="0"/>
                                            <Tab label="NFTs" value="1"/>
                                        </Tabs>
                                    </Box>

                                    <TabPanel sx={{ p: 0 }} value="0">
                                        <TrustLines account="rBRAD8Qd3E6fzgFQKpnA4C1JhgnwgbJ6Cs"/>
                                    </TabPanel>
                                    <TabPanel sx={{ p: 0 }} value="1">
                                        <NFTs account="rBRAD8Qd3E6fzgFQKpnA4C1JhgnwgbJ6Cs"/>
                                    </TabPanel>
                                </TabContext>

                            </CardContent>
                        </Card>
                    </Grid>

                </Grid>

            </Container>
        </OverviewWrapper>
    )
}