import { Icon } from '@iconify/react';
import { useRef, useState } from 'react';
//import editFill from '@iconify/icons-eva/edit-fill';
//import { Link as RouterLink } from 'react-router-dom';
//import trash2Outline from '@iconify/icons-eva/trash-2-outline';
//import detailIcon from '@iconify/icons-bx/detail';
import moreVerticalFill from '@iconify/icons-eva/more-vertical-fill';
// material
import { Link, Menu, MenuItem, IconButton, Avatar, ListItemIcon, ListItemText } from '@mui/material';

// ----------------------------------------------------------------------

export default function TokenMoreMenu({acct, currency}) {
    const ref = useRef(null);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <IconButton ref={ref} onClick={() => setIsOpen(true)}>
                <Icon icon={moreVerticalFill} width={20} height={20} />
            </IconButton>

            <Menu
                open={isOpen}
                anchorEl={ref.current}
                onClose={() => setIsOpen(false)}
                PaperProps={{
                  sx: { width: 170, maxWidth: '100%' }
                }}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://bithomp.com/explorer/${acct}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="bithomp" src="/static/bithomp.png" sx={{ mr:1, width: 36, height: 36 }} />
                        <ListItemText primary="Bithomp" primaryTypographyProps={{ variant: 'subtitle1' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xrpscan.com/account/${acct}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xrpscan" src="/static/xrpscan.png" sx={{ mr:1, width: 36, height: 36 }} />
                        <ListItemText primary="XRPScan" primaryTypographyProps={{ variant: 'subtitle1' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xumm.app/detect/xapp:xumm.dex?issuer=${acct}&currency=${currency}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xumm" src="/static/xumm.jpg" sx={{ mr:1, width: 36, height: 36 }} />
                        <ListItemText primary="XUMM Dex" primaryTypographyProps={{ variant: 'subtitle1' }} />
                    </MenuItem>
                </Link>
                {/* <MenuItem sx={{ color: 'text.secondary' }}>
                    <ListItemIcon>
                        <Icon icon={trash2Outline} width={24} height={24} />
                    </ListItemIcon>
                    <ListItemText primary="Delete" primaryTypographyProps={{ variant: 'body2' }} />
                </MenuItem>

                <MenuItem component={RouterLink} to="#" sx={{ color: 'text.secondary' }}>
                    <ListItemIcon>
                        <Icon icon={editFill} width={24} height={24} />
                    </ListItemIcon>
                    <ListItemText primary="Edit" primaryTypographyProps={{ variant: 'body2' }} />
                </MenuItem> */}
            </Menu>
        </>
    );
}
