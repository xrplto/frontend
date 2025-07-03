import { CopyToClipboard } from 'react-copy-to-clipboard';

// Material
import {
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
  Box,
  Paper,
  Chip,
  Grid,
  useTheme
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { styled, alpha } from '@mui/material/styles';

// Iconify
import { Icon } from '@iconify/react';

import infoFilled from '@iconify/icons-ep/info-filled';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { fVolume } from 'src/utils/formatNumber';
import { convertHexToString, parseNFTokenID } from 'src/utils/parse/utils';

// Components
import NFTPreview from './NFTPreview';
import FlagsContainer from 'src/components/Flags';
import Properties from './Properties';

function getProperties(meta) {
  const properties = [];
  if (!meta) return [];

  // Attributes
  try {
    const attributes = meta.attributes;
    if (attributes && attributes.length > 0) {
      for (const attr of attributes) {
        const type = attr.type || attr.trait_type;
        const value = attr.value;
        properties.push({ type, value });
      }
    }
  } catch (e) {}

  // Other props
  const props = [
    'Rarity',
    'Signature',
    'Background',
    'Base',
    'Mouth',
    'Accessories',
    'Base Effects',
    // ==============
    'Blade Effect',
    'End Scene',
    'Music',
    'Blades In Video',
    // ==============
    'Special'
  ];

  try {
    for (const prop of props) {
      if (meta[prop]) {
        properties.push({ type: prop, value: meta[prop] });
      }
    }
  } catch (e) {}

  return properties;
}

// Styled components for a more polished look
const StyledAccordion = styled(Accordion)(({ theme }) => ({
  borderRadius: '16px !important',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
    theme.palette.background.paper,
    0.8
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}`,
  marginBottom: theme.spacing(2),
  '&:before': {
    display: 'none'
  }
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  borderRadius: '16px 16px 0 0',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
    theme.palette.primary.main,
    0.03
  )} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  minHeight: '64px',
  '&.Mui-expanded': {
    minHeight: '64px',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
  },
  '& .MuiAccordionSummary-expandIconWrapper': {
    color: theme.palette.primary.main
  }
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: '12px',
  fontWeight: 600,
  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(
    theme.palette.info.main,
    0.03
  )} 100%)`,
  border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
  color: theme.palette.info.main
}));

export default function NFTDetails({ nft }) {
  const { accountProfile, openSnackbar } = useContext(AppContext);
  const theme = useTheme();

  const {
    uuid,
    name,
    collection,
    account,
    date,
    meta,
    dfile,
    URI,
    cslug,
    NFTokenID,
    props,
    total,
    volume,
    rarity,
    rarity_rank,
    files
  } = nft;

  const ParsedURI = convertHexToString(URI);

  const { flag, royalty, issuer, taxon, transferFee } = parseNFTokenID(NFTokenID);

  let strDateTime = '';
  if (date) {
    try {
      const dt = new Date(date);
      if (!isNaN(dt.getTime())) {
        // Check if the date is valid
        const strDate = dt.toLocaleDateString();
        const strTime = dt.toLocaleTimeString();
        strDateTime = `${strDate} ${strTime}`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
  }

  const collectionName = collection || meta?.collection?.name || '[No Collection]';

  const properties = props || getProperties(meta);

  return (
    <Box sx={{ maxWidth: 900, margin: 'auto', mt: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.95
          )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.08)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
            opacity: 0.8
          }
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(
              theme.palette.primary.main,
              0.8
            )} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3
          }}
        >
          {name || 'Untitled NFT'}
        </Typography>
        <NFTPreview nft={nft} />

        <Box sx={{ mt: 4 }}>
          <StyledAccordion defaultExpanded>
            <StyledAccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel3bh-content"
              id="panel3bh-header"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.15
                    )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon
                    icon="majesticons:checkbox-list-detail-line"
                    fontSize={20}
                    style={{ color: theme.palette.primary.main }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    fontSize: '1.1rem'
                  }}
                >
                  Properties
                </Typography>
              </Stack>
            </StyledAccordionSummary>
            <AccordionDetails
              sx={{
                borderRadius: '0 0 16px 16px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.6
                )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                backdropFilter: 'blur(10px)'
              }}
            >
              {properties && properties.length > 0 ? (
                <Properties properties={properties} total={total} />
              ) : (
                <Typography align="center">No Properties</Typography>
              )}
            </AccordionDetails>
          </StyledAccordion>

          <StyledAccordion>
            <StyledAccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1bh-content"
              id="panel1bh-header"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.info.main,
                      0.15
                    )} 0%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ArticleIcon sx={{ color: theme.palette.info.main, fontSize: '1.2rem' }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.info.main,
                    fontSize: '1.1rem'
                  }}
                >
                  Details
                </Typography>
              </Stack>
            </StyledAccordionSummary>
            <AccordionDetails
              sx={{
                borderRadius: '0 0 16px 16px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.6
                )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Flags:
                  </Typography>
                  <FlagsContainer Flags={flag} />
                </Grid>
                {strDateTime && (
                  <Grid item xs={12}>
                    <StyledChip label={strDateTime} variant="outlined" />
                  </Grid>
                )}
              </Grid>
              {rarity_rank > 0 && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Typography variant="caption">Rarity Rank</Typography>
                  <Typography variant="s6"># {rarity_rank}</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Typography variant="caption">Taxon</Typography>
                <Typography variant="s6">{taxon}</Typography>
                <Typography variant="caption">Transfer Fee</Typography>
                <Typography variant="s6">{transferFee} %</Typography>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Typography variant="caption">Collection</Typography>
                {cslug ? (
                  <Link href={`/collection/${cslug}`} underline="none">
                    <Typography sx={{ pl: 1 }}>{collectionName}</Typography>
                  </Link>
                ) : (
                  <Typography sx={{ pl: 1 }}>{collectionName}</Typography>
                )}
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Typography variant="caption">Volume</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography>✕</Typography>
                  <Typography variant="s6">{fVolume(volume || 0)}</Typography>
                  <Tooltip title={<Typography variant="body2">Traded volume on XRPL</Typography>}>
                    <Icon icon={infoFilled} />
                  </Tooltip>
                </Stack>
              </Stack>
              <Divider sx={{ mt: 2, mb: 2 }} />

              <Stack spacing={1}>
                <Typography variant="caption">Owner</Typography>
                <Stack
                  direction="row"
                  spacing={0.2}
                  alignItems="center"
                  sx={{ display: 'inline-flex', overflowWrap: 'anywhere' }}
                >
                  <Link
                    href={`/account/${account}`}
                    underline="hover"
                    // target="_blank"
                    variant="info"
                    // rel="noreferrer noopener nofollow"
                  >
                    <Typography sx={{ ml: 1 }}>{account}</Typography>
                  </Link>
                  <CopyToClipboard text={account} onCopy={() => openSnackbar('Copied!', 'success')}>
                    <Tooltip title="Click to copy">
                      <IconButton size="small">
                        <ContentCopyIcon fontSize="small" sx={{ width: 16, height: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </CopyToClipboard>
                </Stack>
              </Stack>
              <Divider sx={{ mt: 2, mb: 2 }} />

              <Stack spacing={1}>
                <Typography variant="caption">Issuer</Typography>
                <Stack
                  direction="row"
                  spacing={0.2}
                  alignItems="center"
                  sx={{ display: 'inline-flex', overflowWrap: 'anywhere' }}
                >
                  <Link
                    href={`/account/${issuer}`}
                    underline="hover"
                    // target="_blank"
                    variant="info"
                    // rel="noreferrer noopener nofollow"
                  >
                    <Typography sx={{ ml: 1 }}>{issuer}</Typography>
                  </Link>
                  <CopyToClipboard text={issuer} onCopy={() => openSnackbar('Copied!', 'success')}>
                    <Tooltip title="Click to copy">
                      <IconButton size="small">
                        <ContentCopyIcon fontSize="small" sx={{ width: 16, height: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </CopyToClipboard>
                </Stack>
              </Stack>
              <Divider sx={{ mt: 2, mb: 2 }} />

              <Stack spacing={1}>
                <Typography variant="caption">NFTokenID</Typography>
                <Link
                  href={`https://livenet.xrpl.org/nfts/${NFTokenID}`}
                  target="_blank"
                  variant="info"
                  rel="noreferrer noopener nofollow"
                >
                  <Typography sx={{ ml: 1 }} style={{ wordWrap: 'break-word' }}>
                    {NFTokenID}
                  </Typography>
                </Link>
              </Stack>
              <Divider sx={{ mt: 2, mb: 2 }} />

              <Stack spacing={1} mt={1}>
                <Typography variant="caption">
                  {`Parsed media files${
                    files?.filter((file) => file.isIPFS).length ? ' (IPFS):' : ':'
                  }`}
                </Typography>
                {files?.map((file, index) => {
                  // Determine the href for the "Cached" link
                  let cachedHref;
                  if (file.isIPFS && file.IPFSPinned) {
                    cachedHref = `https://gateway.xrpnft.com/ipfs/${file.IPFSPath}`;
                  } else if (!file.isIPFS && file.dfile) {
                    cachedHref = `https://s2.xrpnft.com/d1/${file.dfile}`;
                  }

                  return (
                    <Stack key={file.type} spacing={1} alignItems="flex-start">
                      <Typography variant="caption">{`${file.type}:`}</Typography>
                      <Typography
                        variant="body2"
                        sx={{ display: 'inline-flex', overflowWrap: 'anywhere' }}
                      >
                        {/^https?:\/\//.test(file.parsedUrl) ? (
                          <Link
                            href={file.parsedUrl}
                            sx={{ display: 'inline-flex', overflowWrap: 'anywhere' }}
                            underline="hover"
                            target="_blank"
                            variant="body2"
                            rel="noreferrer noopener nofollow"
                          >
                            {file.parsedUrl}
                          </Link>
                        ) : (
                          file.parsedUrl
                        )}
                        {cachedHref && (
                          <Link
                            href={cachedHref}
                            sx={{ display: 'inline-flex', whiteSpace: 'nowrap', ml: 1 }}
                            underline="hover"
                            target="_blank"
                            variant="body2"
                            rel="noreferrer noopener nofollow"
                          >
                            Cached
                          </Link>
                        )}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
              <Divider sx={{ mt: 2, mb: 2 }} />
            </AccordionDetails>
          </StyledAccordion>

          <StyledAccordion>
            <StyledAccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel2bh-content"
              id="panel2bh-header"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.success.main,
                      0.15
                    )} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <DescriptionIcon sx={{ color: theme.palette.success.main, fontSize: '1.2rem' }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.success.main,
                    fontSize: '1.1rem'
                  }}
                >
                  Description
                </Typography>
              </Stack>
            </StyledAccordionSummary>
            <AccordionDetails
              sx={{
                borderRadius: '0 0 16px 16px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.6
                )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <Typography variant="body1">
                {meta?.description || 'No description available for this item.'}
              </Typography>
            </AccordionDetails>
          </StyledAccordion>
        </Box>
      </Paper>
    </Box>
  );
}
