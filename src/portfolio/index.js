import React, { useState } from "react";
import {
    useTheme,
    Box,
    Container,
    Stack,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Tabs,
    Tab,
    Chip,
    Avatar,
    Typography,
    Button
} from '@mui/material';
import styled from '@emotion/styled';
import { getHashIcon } from 'src/utils/extra';
import TrustLines from "./TrustLines";
import { TabContext, TabPanel } from "@mui/lab";


const OverviewWrapper = styled(Box)(({ theme }) => `
    // overflow: hidden;
    flex: 1;
`);

const Balance = styled("div")(() => `
    font-size: 20px;
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
                    <Grid item xs={4}>
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
                                <Typography variant="h6">Estimated Value</Typography>
                                <Balance>215,438.97897 <span>XRP</span></Balance>
                                <Typography variant="h4">Estimated Value</Typography>
                            </Stack>

                            <ButtonFollow variant="outlined">Follow</ButtonFollow>
                        </Stack>
                    </Grid>

                    <Grid item xs={8}>
                        <Card sx={{ height: "520px"}}>
                            <CardContent sx={{ px: 0 }}>
                                <TabContext value={activeTab}>
                                    <Box>
                                        <Tabs value={activeTab} onChange={handleChange} aria-label="wrapped label tabs example">
                                            <Tab label="Tokens" value="0"/>
                                            <Tab label="NFTs" value="1"/>
                                            <Tab label="Offers" value="2"/>
                                        </Tabs>
                                    </Box>

                                    <TabPanel sx={{ p: 0 }} value="0">
                                        <TrustLines account="rBRAD8Qd3E6fzgFQKpnA4C1JhgnwgbJ6Cs"/>
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