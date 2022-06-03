import { styled } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import personFill from '@iconify/icons-bi/person-fill';
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


export default function CommunityMenu() {
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
                id="community_chip"
                aria-owns={open ? "simple-menu" : null}
                aria-haspopup="true"
                onMouseOver={handleOpen}
                onMouseLeave={handleClose}
                style={{ zIndex: 1301 }}
                label="Community" sx={{pl:0.5,pr:0.5}}
                deleteIcon={<Icon icon={chevronDown} width="16" height="16"/>}
                onDelete={handleClick}
                icon={<Icon icon={personFill} width="16" height="16" />} />
            
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
                    href={`https://www.xrpchat.com/`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xrpchat" src="/static/xrpchat.png" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRP Chat" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://www.reddit.com/r/xrp`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => handleClose()} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="reddit" src="/static/reddit.svg" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Reddit" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
            </Menu>
        </>
    );
}
