import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { Icon } from '@iconify/react';
import { useRef, useState } from 'react';
import moreVerticalFill from '@iconify/icons-eva/more-vertical-fill';

import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LinkIcon from '@mui/icons-material/Link';

// Material
import { Avatar, IconButton, Link, ListItemText, Menu, MenuItem } from '@mui/material';
// ----------------------------------------------------------------------

export default function TokenMoreMenu({ token, admin, setEditToken, setTrustToken }) {
  const ref = useRef(null);
  const { issuer, slug, currency } = token;

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
        {admin && (
          <MenuItem
            onClick={() => {
              setIsOpen(false);
              setEditToken(token);
            }}
            disableRipple
            sx={{ color: 'text.secondary' }}
          >
            <EditIcon color="error" sx={{ mr: 1, width: 24, height: 24 }} />
            <ListItemText
              primary="Edit Token"
              primaryTypographyProps={{ variant: 'subtitle2', color: 'error' }}
            />
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            setIsOpen(false);
            setTrustToken(token);
          }}
          disableRipple
          sx={{ color: 'text.secondary' }}
        >
          <LinkIcon sx={{ mr: 1, width: 24, height: 24 }} />
          <ListItemText primary="Trust Set" primaryTypographyProps={{ variant: 'subtitle2' }} />
        </MenuItem>

        <Link
          underline="none"
          color="inherit"
          target="_blank"
          href={`/token/${slug}/trade`}
          rel="noreferrer noopener nofollow"
        >
          <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
            <SwapHorizIcon sx={{ mr: 1, width: 24, height: 24 }} />
            <ListItemText primary="DEX Trade" primaryTypographyProps={{ variant: 'subtitle2' }} />
          </MenuItem>
        </Link>
        {/*
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://bithomp.com/explorer/${issuer}`}
                    rel="noreferrer noopener nofollow"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="bithomp" src="/static/bithomp.webp" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Bithomp" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xrpscan.com/account/${issuer}`}
                    rel="noreferrer noopener nofollow"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xrpscan" src="/static/xrpscan.webp" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRPScan" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>

                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://gatehub.net/explorer/${issuer}`}
                    rel="noreferrer noopener nofollow"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="gatehub" src="/static/gatehub.webp" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="GateHub" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                 <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xrplorer.com/account/${issuer}`}
                    rel="noreferrer noopener nofollow"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xrplorer" src="/static/xrplorer.svg" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="XRPLORER" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link> 
                
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xumm.app/detect/xapp:xumm.dex?issuer=${issuer}&currency=${currency}`}
                    rel="noreferrer noopener nofollow"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xumm" src="/static/xaman.webp" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Xumm DEX" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://sologenic.org/trade?network=mainnet&market=${currency}%2B${issuer}%2FXRP`}
                    rel="noreferrer noopener nofollow"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="sologenic" src="/static/solo.webp" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Sologenic DEX" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://gatehub.net/markets/${currency}+${issuer}/XRP`}
                    rel="noreferrer noopener nofollow"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="gatehub" src="/static/gatehub.webp" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="GateHub DEX" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>


                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xpmarket.com/dex/${currency}+${issuer}/XRP`}
                    rel="noreferrer noopener nofollow"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="gatehub" src="/static/xpmarket.webp" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="xpmarket DEX" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>

                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://xmagnetic.org/dex/${currency}+${issuer}_XRP+XRP`}
                    rel="noreferrer noopener nofollow"
                >
                    <MenuItem onClick={() => setIsOpen(false)} disableRipple sx={{ color: 'text.secondary' }}>
                        <Avatar alt="xumm" src="/static/magnetic.webp" sx={{ mr:1, width: 24, height: 24 }} />
                        <ListItemText primary="Magnetic DEX" primaryTypographyProps={{ variant: 'subtitle2' }} />
                    </MenuItem>
                </Link>*/}
      </Menu>
    </>
  );
}
