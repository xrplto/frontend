// Material
import { alpha, styled } from '@mui/material/styles';

import {
    Link,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

import FiberNewIcon from '@mui/icons-material/FiberNew';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
// ----------------------------------------------------------------------

const RootStyle1 = styled('div')(({ theme }) => ({
    boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha(theme.palette.background.default, 0.0),
    borderRadius: '13px',
    padding: '0em 0.5em 1.5em 0.5em',
    // backgroundColor: alpha("#919EAB", 0.03),
}));

const RootStyle = styled('div')(({ theme }) => ({
    zIndex: 999,
    right: 0,
    display: 'flex',
    cursor: 'pointer',
    position: 'fixed',
    alignItems: 'center',
    top: theme.spacing(20),
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
    backgroundColor: alpha(theme.palette.background.widget, 0.05),
    borderTopLeftRadius: theme.shape.borderRadiusMd,
    borderBottomLeftRadius: theme.shape.borderRadiusMd,
}));

// ----------------------------------------------------------------------
export default function NFTWidget({showNew, setShowNew}) {
    return (
        <Tooltip title="Show recently added tokens">
            <RootStyle>
                <Link
                    component="button"
                    underline="none"
                    variant="body2"
                    color={showNew?'error':'inherit'}
                    onClick={() => {
                        setShowNew(!showNew);
                    }}
                >
                    <Stack spacing={0} sx={{ pt: 2, pb: 2 }} alignItems='center'>
                        <FiberNewIcon />
                        <Typography align="center" style={{ wordWrap: "break-word" }} variant="caption" >
                            Recent
                        </Typography>
                    </Stack>
                </Link>
            </RootStyle>
        </Tooltip>
    );
}
