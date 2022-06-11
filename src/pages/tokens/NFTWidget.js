import { Icon } from '@iconify/react';
import postageStamp from '@iconify/icons-mdi/postage-stamp';
// Material
import { styled } from '@mui/material/styles';
import { Typography, Stack } from '@mui/material';

// ----------------------------------------------------------------------

const RootStyle = styled('div')(({ theme }) => ({
    zIndex: 999,
    right: 0,
    display: 'flex',
    cursor: 'pointer',
    position: 'fixed',
    alignItems: 'center',
    top: theme.spacing(24),
    height: theme.spacing(6),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(2),
    boxShadow: theme.customShadows.z20,
    color: theme.palette.text.widget,
    backgroundColor: theme.palette.background.widget,
    borderTopLeftRadius: theme.shape.borderRadiusMd,
    borderBottomLeftRadius: theme.shape.borderRadiusMd,
    transition: theme.transitions.create('opacity'),
    opacity: 0.8,
    '&:hover': { opacity: 1 }
}));

// ----------------------------------------------------------------------
export default function NFTWidget() {
    return (
        <RootStyle>
            <Stack spacing={0} sx={{ pt: 2 }} alignItems='center'>
                <Icon icon={postageStamp} width={24} height={24} />
                <Typography align="center" style={{ wordWrap: "break-word" }} variant="caption" >
                    XLS-14D
                </Typography>
            </Stack>
        </RootStyle>
    );
}
