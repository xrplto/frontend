// Material
import {
    Grid,
    Stack,
} from '@mui/material';

// Components
import RichListChart from './RichListChart';
import TopListChart from './TopListChart';
import RichStatistics from './RichStatistics';
import Donut from './Donut';
import RichListData from './RichListData';
// ----------------------------------------------------------------------

export default function RichList({data}) {
    const token = data.token;
    const richInfo = data.richInfo;
    const richList = data.richList;
    return (
        <Grid container spacing={3} sx={{p:0}}>
            <Grid item xs={12} md={12} lg={8}>
                <RichListChart token={token} />
            </Grid>

            <Grid item xs={12} md={12} lg={4}>
                <RichStatistics token={token} richInfo={richInfo} />
            </Grid>

            <Grid item xs={12} md={12} lg={8}>
                <TopListChart token={token} />
            </Grid>

            <Grid item xs={12} md={12} lg={4}>
                <Donut richList={richList}/>
            </Grid>

            <Grid item xs={12} md={12} lg={12}>
                <RichListData token={token} />
            </Grid>
        </Grid>
    );
}
