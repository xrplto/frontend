
// Material
import { styled } from '@mui/material/styles';
import {
    Chip,
    Link,
    Menu,
    MenuItem,
    Avatar,
    ListItemText
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import { useState } from 'react';
import zoomIcon from '@iconify/icons-cil/zoom';
import chevronDown from '@iconify/icons-akar-icons/chevron-down';

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


export default function ExplorersMenu({issuer}) {
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
                    href={`https://bithomp.com/explorer/${issuer}`}
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
                    href={`https://gatehub.net/explorer/${issuer}`}
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
                    href={`https://xrpscan.com/account/${issuer}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() =>  handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xrpscan" src="/static/xrpscan.png" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRPScan" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                {/* https://explorer.xrplf.org/r4sHHquyvSxozK5HgCShR7ZqpZE5wzvjHt
                https://livenet.xrpl.org/accounts/r4sHHquyvSxozK5HgCShR7ZqpZE5wzvjHt
                https://xrplorer.com/account/r4sHHquyvSxozK5HgCShR7ZqpZE5wzvjHt */}
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://explorer.xrplf.org/${issuer}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xrplf" src="/static/explorerxrplf.png" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRP Ledger Explorer" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://livenet.xrpl.org/accounts/${issuer}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="sologenic" src="/static/livenetxrplorg.png" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRPL Explorer" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xrplorer.com/account/${issuer}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xumm" src="/static/xrplorer.png" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRPLORER" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
            </Menu>
        </>
    );
}
