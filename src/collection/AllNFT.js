import React from 'react';
import { Box } from '@mui/material';
// Import the NFTGrid component from CollectionView
import CollectionView from './CollectionView';

function AllNFT() {
    // Use CollectionView with null collection to display all NFTs
    return (
        <Box>
            <CollectionView collection={null} />
        </Box>
    );
}

export default React.memo(AllNFT);
