import {
    useTheme,
    Box,
    Typography,
    Paper,
    Radio,
    RadioGroup,
    FormControlLabel,
} from '@mui/material';
import DeFiHistory from './history/DeFi';
import NFTHistory from './history/NFT';
import { useState } from 'react';

const History = ({ account }) => {

    const theme = useTheme();
    const [filter, setFilter] = useState("token");

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
    }

    return (
        <Box>
            <Typography sx={{ color: theme.palette.text.primary, mb: 2 }} variant="h6">Historical Trades</Typography>
            <RadioGroup
                row
                value={filter}
                onChange={handleFilterChange}
                sx={{ mb: 2, color: theme.palette.text.primary }}
            >
                <FormControlLabel value="token" control={<Radio sx={{ color: theme.palette.text.primary }} />} label="Tokens" />
                <FormControlLabel value="nft" control={<Radio sx={{ color: theme.palette.text.primary }} />} label="NFTs" />
            </RadioGroup>
            <Paper sx={{
                width: '100%', overflow: 'auto', maxHeight: "475px", color: theme.palette.text.primary,
                "&::-webkit-scrollbar": {
                    width: "6px !important"
                },
                "&::-webkit-scrollbar-thumb": {
                    borderRadius: "10px",
                    boxShadow: "inset 0 0 6px rgba(0,0,0,.7)",
                },
            }}>
                {
                    filter == "token" ?
                        <DeFiHistory account={account} />
                        : <NFTHistory account={account} />
                }
            </Paper>
        </Box>
    )
}

export default History;