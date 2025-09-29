import Decimal from 'decimal.js-light';
import { CopyToClipboard } from 'react-copy-to-clipboard';

// Material
import {
  useTheme,
  useMediaQuery,
  styled,
  Avatar,
  Backdrop,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Typography,
  TextField,
  alpha
} from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';

import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber } from 'src/utils/formatters';

// Components

// ----------------------------------------------------------------------
const IssuerDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  '& .MuiBackdrop-root': {
    backgroundColor: alpha(theme.palette.background.default, 0.85)
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
    minWidth: { xs: '100%', sm: 400 },
    backgroundColor: theme.palette.background.default
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default
  },
  '& .MuiPaper-root': {
    borderRadius: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    backgroundImage: 'none',
    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
  }
}));

const IssuerInfoDialogTitle = (props) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle
      sx={{ m: 0, p: 2, backgroundColor: (theme) => theme.palette.background.paper }}
      {...other}
    >
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

export default function IssuerInfoDialog({ open, setOpen, token }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { accountProfile, openSnackbar } = useContext(AppContext);

  const { issuer, name, user, currency, md5, ext, issuer_info } = token;

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  const info = issuer_info || {};

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <IssuerDialog fullScreen={fullScreen} onClose={handleClose} open={open} sx={{ zIndex: 1302 }}>
        <IssuerInfoDialogTitle id="customized-dialog-title" onClose={handleClose}>
          <Stack direction="row" alignItems="center">
            <Avatar
              alt={`${user} ${name} Logo`}
              src={imgUrl}
              variant="rounded"
              sx={{
                mr: 1,
                width: 40,
                height: 40,
                borderRadius: 2
              }}
            />
            <Stack>
              <Typography variant="token" color="primary">
                {name}
              </Typography>
              <Typography variant="caption">{user}</Typography>
            </Stack>
          </Stack>
        </IssuerInfoDialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ px: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2" noWrap sx={{ color: 'text.secondary' }}>
                Issuer:
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                <Link
                  underline="hover"
                  target="_blank"
                  href={`https://bithomp.com/explorer/${issuer}`}
                  rel="noreferrer noopener nofollow"
                  sx={{
                    flex: 1,
                    fontFamily: 'monospace',
                    bgcolor: (theme) => alpha(theme.palette.action.selected, 0.08),
                    p: 0.5,
                    borderRadius: 0.5,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main'
                    }
                  }}
                >
                  <Typography variant="body2" noWrap>
                    {issuer}
                  </Typography>
                </Link>
                <CopyToClipboard
                  text={issuer}
                  onCopy={() => openSnackbar('Address copied!', 'success')}
                >
                  <Tooltip title="Copy address">
                    <IconButton size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CopyToClipboard>
              </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2" noWrap sx={{ color: 'text.secondary' }}>
                Currency:
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.action.selected, 0.08),
                    p: 0.5,
                    borderRadius: 0.5
                  }}
                >
                  {currency}
                </Typography>
                <CopyToClipboard
                  text={currency}
                  onCopy={() => openSnackbar('Currency code copied!', 'success')}
                >
                  <Tooltip title="Copy currency code">
                    <IconButton size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CopyToClipboard>
              </Stack>
            </Stack>

            {info.blackholed && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  p: 1.5,
                  borderRadius: 1
                }}
              >
                <Typography variant="body2" color="error.main">
                  This account is BLACKHOLED. It can not issue more tokens.
                </Typography>
              </Stack>
            )}

            {info.domain && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" noWrap sx={{ color: 'text.secondary' }}>
                  Domain:
                </Typography>
                <Link
                  underline="hover"
                  color="inherit"
                  target="_blank"
                  href={
                    info.domain.startsWith('https://') ? `${info.domain}` : `https://${info.domain}`
                  }
                  rel="noreferrer noopener nofollow"
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                >
                  <Typography variant="body2">{info.domain}</Typography>
                </Link>
              </Stack>
            )}

            {Object.entries({
              tickSize: 'Tick Size',
              globalFreeze: 'Global Freeze',
              requireAuth: 'Token Auth',
              disableMaster: 'Disable Master',
              depositAuth: 'Deposit Auth',
              requireDestTag: 'Destination Tag',
              disallowXRP: 'Receiving XRP',
              transferRate: 'Transfer Fee',
              noFreeze: 'No Freeze',
              defaultRipple: 'Rippling'
            }).map(
              ([key, label]) =>
                info[key] && (
                  <Stack key={key} direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" noWrap sx={{ color: 'text.secondary' }}>
                      {label}:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {key === 'transferRate'
                        ? `${fNumber(new Decimal(info[key]).sub(1).mul(100).toNumber())}%`
                        : key === 'tickSize'
                          ? info[key]
                          : key === 'globalFreeze'
                            ? 'Freeze'
                            : key === 'requireAuth'
                              ? 'Required'
                              : key === 'disableMaster'
                                ? 'Disallowed'
                                : key === 'depositAuth'
                                  ? 'Enabled'
                                  : key === 'requireDestTag'
                                    ? 'Required'
                                    : key === 'disallowXRP'
                                      ? 'Disabled'
                                      : key === 'noFreeze'
                                        ? 'True'
                                        : 'Enabled'}
                    </Typography>
                  </Stack>
                )
            )}
          </Stack>
        </DialogContent>
      </IssuerDialog>
    </>
  );
}
