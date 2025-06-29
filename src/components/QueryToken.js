import React, { useContext } from 'react';
import { useState } from 'react';
import Image from 'next/image';

// Material
import { styled, Stack, Typography, Box, alpha } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CurrencySearchModal from 'src/components/CurrencySearchModal';

// Context
import { AppContext } from 'src/AppContext';

const TokenImage = styled(Image)(({ theme }) => ({
  borderRadius: '8px',
  overflow: 'hidden'
}));

const SelectTokenButton = styled(Stack)(({ theme }) => ({
  padding: '4px 8px 4px 4px',
  borderRadius: '20px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    transform: 'translateY(-1px)'
  },
  '&:active': {
    transform: 'translateY(0)'
  }
}));

function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

export default function QueryToken({ token, onChangeToken }) {
  const { darkMode } = useContext(AppContext);

  const [open, setOpen] = useState(false);

  const onDismiss = () => {
    setOpen(false);
  };

  const { md5, name, user, kyc, isOMCF } = token;
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  return (
    <>
      <SelectTokenButton
        direction="row"
        alignItems="center"
        spacing={0.8}
        onClick={() => setOpen(true)}
      >
        <TokenImage
          src={imgUrl}
          width={28}
          height={28}
          onError={(event) => (event.target.src = '/static/alt.webp')}
        />
        <Stack spacing={0}>
          <Typography
            variant="subtitle2"
            color={
              // isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''
              isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : darkMode ? '#007B55' : '#4E8DF4'
            }
            sx={{ lineHeight: 1.2, fontWeight: 600 }}
            noWrap
          >
            {truncate(name, 8)}
          </Typography>
          <Typography
            variant="caption"
            color={isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''}
            sx={{ lineHeight: 1, fontSize: '0.7rem', opacity: 0.7 }}
            noWrap
          >
            {truncate(user, 13)}
            {kyc && (
              <Typography variant="kyc" sx={{ ml: 0.2, fontSize: '0.65rem' }}>
                KYC
              </Typography>
            )}
          </Typography>
          {/* <Typography variant="small" color={isOMCF!=='yes'?'#222531':''}>{date}</Typography> */}
        </Stack>
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.2 }}>
          <ArrowDropDownIcon sx={{ fontSize: 20, opacity: 0.7 }} />
        </Box>
      </SelectTokenButton>

      <CurrencySearchModal
        token={token}
        open={open}
        onDismiss={onDismiss}
        onChangeToken={onChangeToken}
      />
    </>
  );
}
