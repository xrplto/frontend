import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import {
    Box,
    Link
} from '@mui/material';

function Logo({ style }) {
    const { darkMode } = useContext(AppContext);

    const img_black = "/logo/xrpl-to-logo-black.svg";
    const img_white = "/logo/xrpl-to-logo-white.svg";
    
    const img = darkMode?img_white:img_black;
    
    return (
        <Link
            href="/"
            sx={{ pl: 0, pr: 0, py: 3, display: 'inline-flex' }}
            underline="none"
            rel="noreferrer noopener nofollow"
            style={style}
        >
            {/* <Box component="img" src={img} sx={{ height: 46 }} /> */}
            <LazyLoadImage
                src={img}
                width={125}
                height={46}
            />
        </Link>
    );
}

export default Logo;
