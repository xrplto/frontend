import { styled } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import zoomIcon from '@iconify/icons-cil/zoom';
import chevronDown from '@iconify/icons-akar-icons/chevron-down';
// material
import {
    Chip,
    Link,
    Menu,
    MenuItem,
    Avatar,
    ListItemText
} from '@mui/material';

// ----------------------------------------------------------------------
const LinkChip = styled(Chip)(({ theme }) => ({
    // color: theme.palette.text.primary,
    '&&:hover' : {
        backgroundColor: theme.palette.grey[500_24],
        cursor: 'pointer'
    },
    "&&:focus": {
    }
}));


export default function ExplorersMenu({acct, code}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [open, setOpen] = useState(false);

    const handleClick = () => {
    }

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
        setOpen(true);
    };

    const handleOpen1 = (event) => {
        setOpen(true);
    };

    const handleClose = (event) => {
        setOpen(false);
    };

    return (
        <>
            <LinkChip
                id="explorers_chip"
                aria-owns={open ? "simple-menu" : null}
                aria-haspopup="true"
                onMouseOver={handleOpen}
                onMouseLeave={handleClose}
                style={{ zIndex: 1301 }}
                label="Explorers" sx={{pl:0.5,pr:0.5}}
                deleteIcon={<Icon icon={chevronDown} width="16" height="16"/>}
                onDelete={handleClick}
                icon={<Icon icon={zoomIcon} width="16" height="16" />} />
            
            <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                open={open}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "center"
                }}
                MenuListProps={{
                    onMouseOver: handleOpen1,
                    onMouseLeave: handleClose
                }}
                // PaperProps={{
                //   sx: { width: 170, maxWidth: '100%' }
                // }}
            >
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://bithomp.com/explorer/${acct}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="bithomp" src="/static/bithomp.png" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Bithomp" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://gatehub.net/explorer/${acct}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xumm" src="/static/gatehub.jpg" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="GateHub" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xrpscan.com/account/${acct}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() =>  handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xrpscan" src="/static/xrpscan.png" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRPScan" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xumm.app/detect/xapp:xumm.dex?issuer=${acct}&currency=${code}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xumm" src="/static/xumm.jpg" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Xumm DEX" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://sologenic.org/trade?network=mainnet&market=${code}%2B${acct}%2FXRP`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="sologenic" src="/static/solo.jpg" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Sologenic DEX" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
            </Menu>
        </>
    );
}
