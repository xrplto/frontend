// material
import { /*alpha,*/ styled } from '@mui/material/styles';
import {
    Grid,
    Stack
} from '@mui/material';
import PairsList from './PairsList';
// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    //backdropFilter: 'blur(2px)',
    //WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.0),
    //borderRadius: '13px',
    //padding: '0em 0.5em 1.5em 0.5em',
    //backgroundColor: alpha("#919EAB", 0.03),
}));
// ----------------------------------------------------------------------

export default function MarketData({token, pairs}) {
    return (
        <StackStyle>
            <Grid container spacing={3} sx={{p:0}}>
                <Grid item xs={12} md={12} lg={12} sx={{pl:0}}>
                    <PairsList token={token} pairs={pairs} />
                </Grid>
            </Grid>
        </StackStyle>
    );
}
