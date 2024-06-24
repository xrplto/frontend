import React from 'react';

// Material
import {
    Stack,
    Typography
} from '@mui/material';

// Utils
import { CollectionListType } from 'src/utils/constants';

// Components
import CollectionList from './CollectionList';

export default function Collections() {
    return (
        <>
            <Stack spacing={1} sx={{mt: 4, mb:3}}>
                <Typography variant="h1a">Rankings</Typography>
              {/*  <Typography variant="h2b">Discover the leading NFT collections on XRPNFT, ranked by metrics such as volume, floor price, and other key stats.</Typography> */}
            </Stack>
            
            <Stack sx={{mt:5, minHeight: '50vh'}}>
                <CollectionList type={CollectionListType.ALL}/>
            </Stack>
        </>
    );
}
