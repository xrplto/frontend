import axios from 'axios';
import { useContext, useState } from 'react';

// Material
import { Box, Button, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { TabContext, TabPanel } from '@mui/lab';

// Components
import NFTs from './NFTs';
import AccountTransactions from './CollectionActivity/AccountTransactions';
import { AppContext } from 'src/AppContext';

export default function ExploreNFT({ collection }) {
  const BASE_URL = 'https://api.xrpnft.com/api';
  const theme = useTheme();

  const { deletingNfts, accountProfile } = useContext(AppContext);

  const isAdmin = accountProfile?.admin;

  const [value, setValue] = useState('tab-nfts');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleRemoveAll = () => {
    if (deletingNfts.length === 0 || !isAdmin) return;

    const nftNames = deletingNfts
      ?.map((nft) => `"${nft.meta?.name}"` || `"${nft.meta?.Name}"` || `"No Name"`)
      ?.join(', ');
    const idsToDelete = deletingNfts?.map((nft) => nft._id);

    if (!confirm(`You're about to delete the following NFTs ${nftNames}?`)) return;

    axios
      .delete(`${BASE_URL}/nfts`, {
        data: {
          issuer: collection?.account,
          taxon: collection?.taxon,
          cid: collection?.uuid,
          idsToDelete
        }
      })
      .then((res) => {
        location.reload();
      })
      .catch((err) => {
        console.log('Error on removing nfts!', err);
      });
  };

  return (
    <>
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <TabContext value={value}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <ToggleButtonGroup
              value={value}
              exclusive
              onChange={(e, newValue) => newValue && handleChange(e, newValue)}
              size="medium"
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                borderRadius: '16px',
                padding: '4px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.06)}`,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '12px !important',
                  color: alpha(theme.palette.text.secondary, 0.8),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                  minWidth: '100px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  '&.Mui-selected': {
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    boxShadow: `0 4px 12px ${alpha(
                      theme.palette.primary.main,
                      0.15
                    )}, 0 2px 4px ${alpha(theme.palette.common.black, 0.1)}`,
                    transform: 'translateY(-1px)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                      borderRadius: '12px 12px 0 0'
                    }
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    color: theme.palette.primary.main,
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              <ToggleButton value="tab-nfts">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: theme.palette.primary.main,
                      opacity: value === 'tab-nfts' ? 1 : 0.4
                    }}
                  />
                  NFTs
                </Box>
              </ToggleButton>
              <ToggleButton value="tab-creator-transactions">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: theme.palette.success.main,
                      opacity: value === 'tab-creator-transactions' ? 1 : 0.4
                    }}
                  />
                  Activity
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>

            {isAdmin && (
              <Button
                variant="outlined"
                color="error"
                sx={{ mb: 1, py: 0.5 }}
                onClick={handleRemoveAll}
                disabled={deletingNfts.length === 0}
              >
                Delete All
              </Button>
            )}
          </Box>
          <TabPanel value="tab-nfts" sx={{ pl: 0, pr: 0 }}>
            <NFTs collection={collection} />
          </TabPanel>
          <TabPanel value="tab-creator-transactions" sx={{ pl: 0, pr: 0 }}>
            <AccountTransactions creatorAccount={collection?.account} />
          </TabPanel>
        </TabContext>
      </Box>
    </>
  );
}
