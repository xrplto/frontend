// Material
import { alpha, styled } from '@mui/material/styles';

import {
    Link,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
// ----------------------------------------------------------------------

const RootStyle = styled('div')(({ theme }) => ({
    zIndex: 999,
    right: 0,
    display: 'flex',
    cursor: 'pointer',
    position: 'fixed',
    alignItems: 'center',
    top: theme.spacing(28),
    height: theme.spacing(6),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    // boxShadow: theme.customShadows.z20,
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)', // Fix on Mobile
    // color: theme.palette.text.widget,
    // backgroundColor: theme.palette.background.widget,
    backgroundColor: alpha('#8C7CF0', 0.08),
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
}));

// ----------------------------------------------------------------------
export default function NFTWidget({showSlug, setShowSlug}) {
    return (
    <Tooltip title="Show tokens without URL Slug set">
        <RootStyle>
            <Link
                component="button"
                underline="none"
                variant="body2"
                color={showSlug?'error':'inherit'}
                onClick={() => {
                    setShowSlug(!showSlug);
                }}
            >
                <Stack spacing={0} sx={{ pt: 2, pb: 2 }} alignItems='center'>
                    <DoNotTouchIcon />
                    <Typography align="center" style={{ wordWrap: "break-word" }} variant="caption" >
                        URL Slug
                    </Typography>
                </Stack>
            </Link>
        </RootStyle>
    </Tooltip>
    );
}
