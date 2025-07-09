import { CopyToClipboard } from 'react-copy-to-clipboard';

// Material
import {
  Box,
  Typography,
  Stack,
  Divider,
  IconButton,
  Link,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
  Grid,
  Paper
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { styled, alpha } from '@mui/material/styles';

// Iconify
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { fVolume, fNumber } from 'src/utils/formatNumber';
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

// Styled components
const Container = styled(Box)(({ theme }) => ({
  maxWidth: 600,
  margin: '0 auto',
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1)
  }
}));

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(2)
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1),
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}));

const InfoItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  '&:last-child': {
    marginBottom: 0
  }
}));

const Label = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(0.25)
}));

const Value = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.primary,
  wordBreak: 'break-all'
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  marginLeft: theme.spacing(0.5),
  '& .MuiSvgIcon-root': {
    fontSize: '1rem'
  }
}));

const CompactChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.75rem',
  '& .MuiChip-icon': {
    fontSize: '0.875rem'
  }
}));

export default function NFTDetails({ nft }) {
  const { openSnackbar } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    name,
    collection,
    account,
    date,
    meta,
    URI,
    cslug,
    NFTokenID,
    props,
    total,
    volume,
    rarity_rank,
    files
  } = nft;

  const { flag, issuer, taxon, transferFee } = parseNFTokenID(NFTokenID);

  let strDateTime = '';
  if (date) {
    try {
      const dt = new Date(date);
      if (!isNaN(dt.getTime())) {
        strDateTime = dt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
  }

  const collectionName = collection || meta?.collection?.name || 'No Collection';
  const properties = props || getProperties(meta);

  return (
    <Container>
      {/* Title */}
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        {name || 'Untitled NFT'}
      </Typography>

      {/* NFT Preview */}
      <Box sx={{ mb: 3 }}>
        <NFTPreview nft={nft} />
      </Box>

      {/* Basic Info */}
      <Section>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <InfoItem>
              <Label>Collection</Label>
              {cslug ? (
                <Link href={`/collection/${cslug}`} underline="hover">
                  <Value color="primary">{collectionName}</Value>
                </Link>
              ) : (
                <Value>{collectionName}</Value>
              )}
            </InfoItem>
          </Grid>
          {strDateTime && (
            <Grid item xs={6}>
              <InfoItem>
                <Label>Created</Label>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <CalendarTodayIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                  <Value>{strDateTime}</Value>
                </Stack>
              </InfoItem>
            </Grid>
          )}
          {rarity_rank > 0 && (
            <Grid item xs={6}>
              <InfoItem>
                <Label>Rarity Rank</Label>
                <CompactChip label={`#${rarity_rank}`} size="small" color="primary" />
              </InfoItem>
            </Grid>
          )}
          {volume > 0 && (
            <Grid item xs={6}>
              <InfoItem>
                <Label>Volume</Label>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Value>✕ {fVolume(volume)}</Value>
                  <Tooltip title="Traded volume on XRPL">
                    <InfoOutlinedIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                  </Tooltip>
                </Stack>
              </InfoItem>
            </Grid>
          )}
        </Grid>
      </Section>

      <Divider sx={{ mb: 3 }} />

      {/* Properties */}
      {properties && properties.length > 0 && (
        <Section>
          <SectionTitle>Properties</SectionTitle>
          <Properties properties={properties} total={total} />
        </Section>
      )}

      {/* Description */}
      {meta?.description && (
        <Section>
          <SectionTitle>Description</SectionTitle>
          <Value sx={{ lineHeight: 1.6 }}>{meta.description}</Value>
        </Section>
      )}

      {/* Technical Details */}
      <Section>
        <SectionTitle>Details</SectionTitle>
        
        {/* Flags */}
        <InfoItem>
          <Label>Flags</Label>
          <FlagsContainer Flags={flag} />
        </InfoItem>

        {/* Owner */}
        <InfoItem>
          <Label>Owner</Label>
          <Stack direction="row" alignItems="center">
            <Link href={`/account/${account}`} underline="hover">
              <Value sx={{ fontSize: '0.75rem' }}>
                {isMobile ? `${account.slice(0, 6)}...${account.slice(-6)}` : account}
              </Value>
            </Link>
            <CopyToClipboard text={account} onCopy={() => openSnackbar('Copied!', 'success')}>
              <Tooltip title="Copy address">
                <CopyButton size="small">
                  <ContentCopyIcon />
                </CopyButton>
              </Tooltip>
            </CopyToClipboard>
          </Stack>
        </InfoItem>

        {/* Issuer */}
        <InfoItem>
          <Label>Issuer</Label>
          <Stack direction="row" alignItems="center">
            <Link href={`/account/${issuer}`} underline="hover">
              <Value sx={{ fontSize: '0.75rem' }}>
                {isMobile ? `${issuer.slice(0, 6)}...${issuer.slice(-6)}` : issuer}
              </Value>
            </Link>
            <CopyToClipboard text={issuer} onCopy={() => openSnackbar('Copied!', 'success')}>
              <Tooltip title="Copy address">
                <CopyButton size="small">
                  <ContentCopyIcon />
                </CopyButton>
              </Tooltip>
            </CopyToClipboard>
          </Stack>
        </InfoItem>

        {/* Token Info */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <InfoItem>
              <Label>Taxon</Label>
              <Value>{taxon}</Value>
            </InfoItem>
          </Grid>
          <Grid item xs={6}>
            <InfoItem>
              <Label>Transfer Fee</Label>
              <Value>{transferFee}%</Value>
            </InfoItem>
          </Grid>
        </Grid>

        {/* NFTokenID */}
        <InfoItem sx={{ mt: 2 }}>
          <Label>NFTokenID</Label>
          <Link
            href={`https://livenet.xrpl.org/nfts/${NFTokenID}`}
            target="_blank"
            rel="noreferrer noopener nofollow"
            underline="hover"
          >
            <Value sx={{ fontSize: '0.7rem', color: 'primary.main' }}>
              {isMobile ? `${NFTokenID.slice(0, 16)}...${NFTokenID.slice(-16)}` : NFTokenID}
            </Value>
          </Link>
        </InfoItem>

        {/* Media Files */}
        {files && files.length > 0 && (
          <InfoItem sx={{ mt: 2 }}>
            <Label>Media Files</Label>
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {files.map((file, index) => {
                let cachedHref;
                if (file.isIPFS && file.IPFSPinned) {
                  cachedHref = `https://gateway.xrpnft.com/ipfs/${file.IPFSPath}`;
                } else if (!file.isIPFS && file.dfile) {
                  cachedHref = `https://s2.xrpnft.com/d1/${file.dfile}`;
                }

                return (
                  <Box key={file.type}>
                    <Typography variant="caption" color="text.secondary">
                      {file.type}:
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {/^https?:\/\//.test(file.parsedUrl) ? (
                        <Link
                          href={file.parsedUrl}
                          target="_blank"
                          rel="noreferrer noopener nofollow"
                          underline="hover"
                        >
                          <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                            {file.parsedUrl}
                          </Typography>
                        </Link>
                      ) : (
                        <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                          {file.parsedUrl}
                        </Typography>
                      )}
                      {cachedHref && (
                        <Link
                          href={cachedHref}
                          target="_blank"
                          rel="noreferrer noopener nofollow"
                          underline="hover"
                        >
                          <Typography variant="caption" color="primary">
                            [Cached]
                          </Typography>
                        </Link>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </InfoItem>
        )}
      </Section>
    </Container>
  );
}