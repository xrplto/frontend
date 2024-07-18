import React, { useState, useEffect } from 'react';

// Material
import {
    Stack,
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    Grid
} from '@mui/material';

// Utils
import { CollectionListType } from 'src/utils/constants';

// Components
import CollectionList from './CollectionList';

const LatestNFTActivity = ({ title, data }) => (
    <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h2b" sx={{ mb: 1 }}>{title}</Typography>
        <List>
            {data.map((item, index) => (
                <ListItem key={index}>
                    <ListItemText primary={item.name} secondary={item.details} />
                </ListItem>
            ))}
        </List>
    </Paper>
);

export default function Collections() {
    const [latestMints, setLatestMints] = useState([]);
    const [latestTransfers, setLatestTransfers] = useState([]);
    const [latestSales, setLatestSales] = useState([]);

    useEffect(() => {
        // Fetch latest mints
        fetch('/api/latest-mints')
            .then(response => response.json())
            .then(data => setLatestMints(data))
            .catch(error => console.error('Error fetching latest mints:', error));

        // Fetch latest transfers
        fetch('/api/latest-transfers')
            .then(response => response.json())
            .then(data => setLatestTransfers(data))
            .catch(error => console.error('Error fetching latest transfers:', error));

        // Fetch latest sales
        fetch('/api/latest-sales')
            .then(response => response.json())
            .then(data => setLatestSales(data))
            .catch(error => console.error('Error fetching latest sales:', error));
    }, []);

    return (
        <>
        

            <Box sx={{ mt: 5 }}>
                <Typography variant="h2b" sx={{ mb: 2 }}>Latest NFT Activity</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <LatestNFTActivity title="Latest Mints" data={latestMints} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <LatestNFTActivity title="Latest Transfers" data={latestTransfers} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <LatestNFTActivity title="Latest Sales" data={latestSales} />
                    </Grid>
                </Grid>
            </Box>
            
            <Stack sx={{ mt: 5, minHeight: '50vh' }}>
                <CollectionList type={CollectionListType.ALL} />
            </Stack>
        </>
    );
}
