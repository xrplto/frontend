import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import {
    Box,
    Link,
    useTheme
} from '@mui/material';

function Logo() {
    const theme = useTheme();

    const { darkMode } = useContext(AppContext);

    const img_black = "/XRPL_Logo2_Colored_(Black).png";
    const img_white = "/XRPL_Logo2_Colored_(White).png";
    
    const img = darkMode?img_white:img_black;

    return (
        <Link href="/" sx={{ pl: 0, pr: 0, py: 3, display: 'inline-flex' }} underline="none">
            {/* <Box component="img" src={img} sx={{ height: 46 }} /> */}
            <LazyLoadImage
                alt=''
                src={img}
                // width={56}
                height={46}
            />
        </Link>
    );
}

export default Logo;
