// Material
import { withStyles } from '@mui/styles';
import {
    alpha,
    Link,
    Stack,
    Typography
} from '@mui/material';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Components

const ContentTypography = withStyles({
    root: {
        color: alpha('#919EAB', 0.99)
    }
})(Typography);


export default function SummaryTag({tagName}) {

    return (
        <Stack sx={{mt:2}}>
            <Typography variant='h1'>Top {tagName} Tokens by Volume</Typography>

            <ContentTypography variant='subtitle1' sx={{mt:2}}>
                This page lists the top {tagName} tokens. These projects are listed by 24H Volume with the largest first and then descending in order. To reorder the list, simply click on one of the options - such as 24h or 7d - to see the sector from a different perspective.
            </ContentTypography>
        </Stack>
    )
}