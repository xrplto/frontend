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
  borderRadius: '50%',
  overflow: 'hidden',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? alpha(theme.palette.divider, 0.1) 
    : alpha(theme.palette.divider, 0.08)}`,
  transition: 'all 0.3s ease'
}));

const SelectTokenButton = styled(Stack)(({ theme }) => ({
  padding: '8px 12px 8px 8px',
  borderRadius: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: 'transparent',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? alpha(theme.palette.divider, 0.08) 
    : alpha(theme.palette.divider, 0.06)}`,
  backdropFilter: 'blur(8px)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.1),
    borderColor: alpha(theme.palette.primary.main, 0.3),
    transform: 'translateY(-1px)',
    '& .arrow-icon': {
      transform: 'rotate(180deg)',
      color: theme.palette.primary.main
    }
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

  // Add null check and provide default values
  if (!token) {
    return null;
  }

  const { 
    md5 = '', 
    name = 'Select Token', 
    user = '', 
    kyc = false, 
    isOMCF = 'no' 
  } = token;
  
  const imgUrl = md5 ? `https://s1.xrpl.to/token/${md5}` : '/static/alt.webp';

  return (
    <>
      <SelectTokenButton
        direction="row"
        alignItems="center"
        spacing={1.5}
        onClick={() => setOpen(true)}
      >
        <Box sx={{ position: 'relative' }}>
          <TokenImage
            src={imgUrl}
            width={36}
            height={36}
            alt={name || 'Token'}
            onError={(event) => (event.target.src = '/static/alt.webp')}
          />
          {kyc && (
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                backgroundColor: '#00AB55',
                borderRadius: '50%',
                width: 14,
                height: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${darkMode ? '#1a1a1a' : '#ffffff'}`,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Typography sx={{ fontSize: '8px', color: 'white', fontWeight: 'bold' }}>✓</Typography>
            </Box>
          )}
        </Box>
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            color={
              isOMCF !== 'yes' 
                ? 'text.primary' 
                : darkMode ? '#00AB55' : '#4E8DF4'
            }
            sx={{ 
              lineHeight: 1.2, 
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '-0.01em'
            }}
            noWrap
          >
            {name || 'Select Token'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ 
              lineHeight: 1, 
              fontSize: '0.75rem', 
              opacity: 0.8,
              letterSpacing: '0.02em'
            }}
            noWrap
          >
            {user ? truncate(user, 15) : 'Choose a token to swap'}
          </Typography>
        </Stack>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: theme => alpha(theme.palette.primary.main, 0.1),
            borderRadius: '50%',
            width: 28,
            height: 28,
            justifyContent: 'center',
            ml: 1
          }}
        >
          <ArrowDropDownIcon 
            className="arrow-icon"
            sx={{ 
              fontSize: 18, 
              color: 'primary.main',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }} 
          />
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
