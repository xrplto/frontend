import Decimal from 'decimal.js';
// Material
import {
  alpha,
  styled,
  useTheme,
  CardHeader,
  Stack,
  Typography,
  Table,
  TableRow,
  TableBody,
  TableCell,
  Tooltip,
  IconButton,
  Avatar,
  Chip,
  Link
} from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Iconify
import { Icon } from '@iconify/react';
import blackholeIcon from '@iconify/icons-arcticons/blackhole';

// Components
import BearBullLabel from './BearBullLabel';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import IssuerInfoDialog from '../common/IssuerInfoDialog';

// Redux
import { useSelector /*, useDispatch*/ } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber, fNumberWithCurreny } from 'src/utils/formatNumber';

import NumberTooltip from 'src/components/NumberTooltip';

// ----------------------------------------------------------------------
import StackStyle from 'src/components/StackStyle';
import { currencySymbols } from 'src/utils/constants';
import { useContext, useState } from 'react';
import { AppContext } from 'src/AppContext';

const badge24hStyle = {
  display: 'inline-block',
  marginLeft: '3px',
  color: '#C4CDD5',
  fontSize: '10px',
  fontWeight: '500',
  lineHeight: '16px',
  backgroundColor: '#323546',
  borderRadius: '3px',
  padding: '1px 3px'
};
// ----------------------------------------------------------------------

export default function PriceStatistics({ token }) {
  const theme = useTheme();
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency, openSnackbar } = useContext(AppContext);
  const [openIssuerInfo, setOpenIssuerInfo] = useState(false);

  const {
    id,
    name,
    amount,
    exch,
    maxMin24h,
    pro24h,
    p24h,
    vol24h,
    vol24hxrp,
    vol24hx,
    marketcap,
    dom,
    issuer,
    issuer_info,
    assessment
  } = token;

  const info = issuer_info || {};
  const img_xrplf =
    theme.palette.mode === 'dark' ? '/static/xrplf_white.svg' : '/static/xrplf_black.svg';

  function truncate(str, n) {
    if (!str) return '';
    return str.length > n ? str.substr(0, n - 1) + '... ' : str;
  }

  let user = token.user;
  if (!user) user = name;

  const voldivmarket =
    marketcap > 0 && vol24hxrp != null ? Decimal.div(vol24hxrp || 0, marketcap || 1).toNumber() : 0;
  const convertedMarketCap =
    marketcap != null && metrics[activeFiatCurrency] != null
      ? Decimal.div(marketcap || 0, metrics[activeFiatCurrency] || 1).toNumber()
      : 0;

  let strPc24h = fNumber(p24h < 0 ? -p24h : p24h);
  let strPc24hPrep = (p24h < 0 ? '-' : '') + currencySymbols[activeFiatCurrency];

  const handleOpenIssuerInfo = () => {
    setOpenIssuerInfo(true);
  };

  return (
    <StackStyle>
      <IssuerInfoDialog open={openIssuerInfo} setOpen={setOpenIssuerInfo} token={token} />
      <CardHeader
        title={`${name} Token Details`}
        subheader=""
        sx={{
          p: 1.5,
          '& .MuiCardHeader-title': {
            fontSize: '1rem',
            fontWeight: 600
          }
        }}
      />
      <Table
        size="small"
        sx={{
          [`& .${tableCellClasses.root}`]: {
            borderBottom: '1px solid',
            borderBottomColor: theme.palette.divider,
            py: 1,
            '&:first-of-type': {
              pl: 1.5
            },
            '&:last-of-type': {
              pr: 1.5
            }
          }
        }}
      >
        <TableBody>
          <TableRow>
            <TableCell align="left">
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                Issuer
              </Typography>
            </TableCell>
            <TableCell align="left">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="s8">{truncate(issuer, 16)}</Typography>
                      {info.blackholed && (
                        <Tooltip title="Blackholed - Cannot issue more tokens">
                          <Icon
                            icon={blackholeIcon}
                            width="16"
                            height="16"
                            style={{ color: '#ff0000' }}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                  }
                  size="small"
                  sx={{ pl: 0.5, pr: 0.5, borderRadius: '6px', height: '24px', cursor: 'pointer' }}
                  onClick={handleOpenIssuerInfo}
                />
                <CopyToClipboard text={issuer} onCopy={() => openSnackbar('Copied!', 'success')}>
                  <Tooltip title="Copy issuer address">
                    <IconButton size="small" sx={{ p: 0.5 }}>
                      <ContentCopyIcon sx={{ width: 14, height: 14 }} />
                    </IconButton>
                  </Tooltip>
                </CopyToClipboard>
                {assessment && (
                  <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={assessment}
                    rel="noreferrer noopener nofollow"
                  >
                    <Tooltip title="View XRPL Foundation Assessment">
                      <IconButton size="small" sx={{ p: 0.5 }}>
                        <LazyLoadImage src={img_xrplf} width={14} height={14} />
                      </IconButton>
                    </Tooltip>
                  </Link>
                )}
              </Stack>
            </TableCell>
          </TableRow>
          <TableRow></TableRow>
          <TableRow>
            <TableCell align="left">
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                {user} Price
              </Typography>
            </TableCell>
            <TableCell align="left">
              <Typography variant="body2">
                <NumberTooltip
                  prepend={currencySymbols[activeFiatCurrency]}
                  number={fNumberWithCurreny(exch, metrics[activeFiatCurrency])}
                />
              </Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left">
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                Price Change<span style={badge24hStyle}>24h</span>
              </Typography>
            </TableCell>
            <TableCell align="left">
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <NumberTooltip
                    prepend={strPc24hPrep}
                    number={fNumberWithCurreny(Number(strPc24h), metrics[activeFiatCurrency])}
                  />
                </Typography>
                <BearBullLabel value={pro24h} variant="small" />
              </Stack>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left">
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                24h Low / 24h High
              </Typography>
            </TableCell>
            <TableCell align="left">
              <NumberTooltip
                prepend={currencySymbols[activeFiatCurrency]}
                number={fNumber(
                  Decimal.mul(
                    Decimal.mul(maxMin24h[1], metrics.USD),
                    1 / metrics[activeFiatCurrency]
                  )
                )}
              />{' '}
              /{' '}
              <NumberTooltip
                prepend={currencySymbols[activeFiatCurrency]}
                // number={fNumber(
                //   activeFiatCurrency === 'USD'
                //     ? maxMin24h[1]
                //     : Decimal.mul(
                //         Decimal.div(maxMin24h[0], metrics.USD),
                //         1 / metrics[activeFiatCurrency]
                //       )
                // )}
                number={fNumber(
                  Decimal.mul(
                    Decimal.mul(maxMin24h[0], metrics.USD),
                    1 / metrics[activeFiatCurrency]
                  )
                )}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left">
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                Trading Volume<span style={badge24hStyle}>24h</span>
              </Typography>
            </TableCell>
            <TableCell align="left">
              {currencySymbols[activeFiatCurrency]}
              {fNumber(vol24hxrp / metrics[activeFiatCurrency])}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left">
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                Volume / Market Cap
              </Typography>
            </TableCell>
            <TableCell align="left">
              <NumberTooltip number={fNumber(voldivmarket)} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left">
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                Market Dominance
              </Typography>
            </TableCell>
            <TableCell align="left">
              <NumberTooltip number={fNumber(dom || 0)} /> %
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left">
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                Market Rank
              </Typography>
            </TableCell>
            <TableCell align="left">{'#' + (Number(id) - 1)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left">
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                Market Cap
              </Typography>
            </TableCell>
            <TableCell align="left">
              {currencySymbols[activeFiatCurrency]} {fNumber(convertedMarketCap)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left">
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                Diluted Market Cap
              </Typography>
            </TableCell>
            <TableCell align="left">
              {currencySymbols[activeFiatCurrency]}{' '}
              {fNumber(amount * (exch / metrics[activeFiatCurrency]))}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </StackStyle>
  );
}
