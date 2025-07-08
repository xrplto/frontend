import React from 'react';
// Components
import ExploreNFT from 'src/explore';

function AllNFT() {

    return (
        <>
            <ExploreNFT collection={null} />
        </>
    );
}

export default React.memo(AllNFT);
