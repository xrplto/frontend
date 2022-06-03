import { Icon } from '@iconify/react';
import { useRef, useState } from 'react';
import moreVerticalFill from '@iconify/icons-eva/more-vertical-fill';
import EditIcon from '@mui/icons-material/Edit';
import EditTokenDialog from './EditTokenDialog';

// Material
import {
    Avatar,
    IconButton,
    Link,
    ListItemText,
    Menu,
    MenuItem
} from '@mui/material';

import { useContext } from 'react'
import Context from '../../Context'
// ----------------------------------------------------------------------

export default function TokenMoreMenu({token}) {
    const ref = useRef(null);
    const {
        issuer,
        currency
    } = token;

    const [isOpen, setIsOpen] = useState(false);
    const [openEditToken, setOpenEditToken] = useState(false);
    const { accountProfile } = useContext(Context);
    

    const onEditToken = () => {
        setIsOpen(false);
        setOpenEditToken(true);
    }

    const onCloseEditToken = () => {
        setOpenEditToken(false);
    }

    return (
        <>
            <IconButton ref={ref} onClick={() => setIsOpen(true)}>
                <Icon icon={moreVerticalFill} width={20} height={20} />
            </IconButton>

            <EditTokenDialog token={token} open={openEditToken} onCloseEditToken={onCloseEditToken}/>

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
                {accountProfile && accountProfile.account && accountProfile.admin && (
                    <MenuItem onClick={() => onEditToken()} disableRipple sx={{ color: 'text.secondary' }}>
                        <EditIcon color='error' sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Edit Token" primaryTypographyProps={{ variant: 'subtitle2', color:'error' }} />
                    </MenuItem>
                )}

                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://bithomp.com/explorer/${issuer}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="bithomp" src="/static/bithomp.png" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Bithomp" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xrpscan.com/account/${issuer}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xrpscan" src="/static/xrpscan.png" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRPScan" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://gatehub.net/explorer/${issuer}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="gatehub" src="/static/gatehub.jpg" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="GateHub" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                {/* <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xrplorer.com/account/${issuer}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xrplorer" src="/static/xrplorer.svg" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRPLORER" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link> */}
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xumm.app/detect/xapp:xumm.dex?issuer=${issuer}&currency=${currency}`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xumm" src="/static/xumm.jpg" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Xumm DEX" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://sologenic.org/trade?network=mainnet&market=${currency}%2B${issuer}%2FXRP`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="sologenic" src="/static/solo.jpg" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Sologenic DEX" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://gatehub.net/markets/${currency}+${issuer}/XRP`}
                    rel="noreferrer noopener"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="gatehub" src="/static/gatehub.jpg" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="GateHub DEX" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
            </Menu>
        </>
    );
}
