import { useRef, useState, useEffect } from 'react';

// Material
import {
    useTheme, useMediaQuery,
    Link,
    Typography
} from '@mui/material';

export default function SeeMoreTypography({variant, text}) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.up('sm'));

    const limit = fullScreen?100:30;

    const [showContent, setShowContent] = useState(false);

    if (!text)
        return (<></>);

    return (
        <>
        {text.length < limit ?
            <Typography variant={variant}>{text}</Typography>
            :
            <>
            <Typography variant={variant}>
                {showContent ? text: text.slice(0, limit) + " ... "}
                <Link
                    component="button"
                    onClick={() => {
                        setShowContent(!showContent);
                    }}
                >
                    <Typography variant={variant} color='#2de370' sx={{ml:1}}>{showContent?'See Less':'See More'}</Typography>
                </Link>
            </Typography>
            </>
        }
        </>
    );
};
