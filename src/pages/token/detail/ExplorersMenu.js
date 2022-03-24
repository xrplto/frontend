import { styled } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { useRef, useState } from 'react';
import zoomIcon from '@iconify/icons-cil/zoom';
import chevronDown from '@iconify/icons-akar-icons/chevron-down';
import { withStyles } from '@mui/styles';
// material
import {
    Button,
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


export default function ExplorersMenu({acct}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [open, setOpen] = useState(false);

    const handleClick = () => {
    }

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
        setOpen(true);
    };

    const handleClose = (e) => {
        if (e.currentTarget.localName !== "ul") {
            const menu = document.getElementById("simple-menu").children[2];
            const menuBoundary = {
                left: menu.offsetLeft,
                top: e.currentTarget.offsetTop + e.currentTarget.offsetHeight,
                right: menu.offsetLeft + menu.offsetHeight,
                bottom: menu.offsetTop + menu.offsetHeight
            };
            if (
                e.clientX >= menuBoundary.left &&
                e.clientX <= menuBoundary.right &&
                e.clientY <= menuBoundary.bottom &&
                e.clientY >= menuBoundary.top
            ) {
                return;
            }
        }
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
                    href={`https://xrpscan.com/account/${acct}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() =>  handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xrpscan" src="/static/xrpscan.png" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRPScan" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
            </Menu>
        </>
    );
}
