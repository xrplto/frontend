import React, { useState } from 'react';
import { Button, Stack, Typography, Input, IconButton, Box } from '@mui/material';
import { styled, useTheme, keyframes } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import exchangeIcon from '@iconify/icons-uil/exchange';
import swapIcon from '@iconify/icons-uil/sync'; // Import an icon for swap
import hideIcon from '@iconify/icons-uil/eye-slash'; // Import an icon for hide

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 1;
  }
  70% {
    transform: scale(1);
    opacity: 0.7;
  }
  100% {
    transform: scale(0.95);
    opacity: 1;
  }
`;

const CurrencyContent = styled('div')(
  ({ theme }) => `
    box-sizing: border-box;
    margin: 10px 0;
    display: flex;
    flex-direction: row;
    padding: 20px;
    border-radius: 10px;
    align-items: center;
    background-color: ${theme.palette.background.paper};
    border: 1px solid ${theme.palette.divider};
    width: 100%;
    justify-content: space-between;
`
);

const InputContent = styled('div')(
  ({ theme }) => `
    box-sizing: border-box;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    color: ${theme.palette.text.primary};
`
);

const OverviewWrapper = styled('div')(
  ({ theme }) => `
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    position: relative;
    border-radius: 16px;
    display: flex;
    border: ${theme.palette.divider};
    padding-bottom: 10px;
    max-width: 600px;
    width: 100%;
    background-color: ${theme.palette.background.default};
    @media (max-width: 600px) {
        border-right: none;
        border-left: none;
        border-image: initial;
        border-radius: unset;
        border-top: none;
        border-bottom: none;
    }
`
);

const ConverterFrame = styled('div')(
  ({ theme }) => `
    flex-direction: column;
    overflow: hidden;
    position: relative;
    display: flex;
    width: 100%;
`
);

const ToggleContent = styled('div')(
  ({ theme }) => `
    cursor: pointer;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background-color: ${theme.palette.background.paper};
    border-radius: 50%;
    padding: 6px;
`
);

const ExchangeButton = styled(Button)(
  ({ theme }) => `
    width: 100%;
    max-width: 600px;
    @media (max-width: 600px) {
        margin-left: 10px;
        margin-right: 10px;
    }
`
);

const PulsatingCircle = styled('div')(
  ({ theme }) => `
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${theme.palette.primary.main};
    animation: ${pulse} 1.5s infinite;
    margin-right: 8px;
`
);

const Swap = () => {
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');

  const handleSwap = () => {
    console.log(`Swapping ${sellAmount} XRP to SOLO`);
  };

  const theme = useTheme();
  const color1 = theme.palette.background.default;
  const color2 = theme.palette.background.default;

  return (
    <Stack alignItems="center" width="100%">
      <OverviewWrapper>
        <ConverterFrame>
          <CurrencyContent style={{ backgroundColor: color1 }}>
            <Box display="flex" flexDirection="column" flex="1">
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="subtitle1">You sell</Typography>
                
              </Box>
              
              <Typography variant="h6">XRP</Typography>
              <Typography variant="body2" color="textSecondary">XRPL</Typography>
            </Box>
            <InputContent>
              <Input
                placeholder="0"
                autoComplete="new-password"
                disableUnderline
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                sx={{
                  width: '100%',
                  input: {
                    autoComplete: 'off',
                    padding: '10px 0px',
                    border: 'none',
                    fontSize: '18px',
                    textAlign: 'end',
                    appearance: 'none',
                    fontWeight: 700
                  }
                }}
              />
              <Typography variant="body2" color="textSecondary">~$0.00</Typography>
            </InputContent>
          </CurrencyContent>

          <CurrencyContent style={{ backgroundColor: color2 }}>
            <Box display="flex" flexDirection="column" flex="1">
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="subtitle1">You buy</Typography>
         
              </Box>
              <Typography variant="h6">SOLO</Typography>
              <Typography variant="body2" color="textSecondary">Sologenic</Typography>
            </Box>
            <InputContent>
              <Input
                placeholder="0"
                autoComplete="new-password"
                disableUnderline
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                disabled
                sx={{
                  width: '100%',
                  input: {
                    autoComplete: 'off',
                    padding: '10px 0px',
                    border: 'none',
                    fontSize: '18px',
                    textAlign: 'end',
                    appearance: 'none',
                    fontWeight: 700
                  }
                }}
              />
              <Typography variant="body2" color="textSecondary">~$0.00</Typography>
            </InputContent>
          </CurrencyContent>
          
          <ToggleContent>
            <IconButton size="medium" onClick={handleSwap}>
              <Icon
                icon={exchangeIcon}
                width="28"
                height="28"
                style={{
                  color: theme.palette.text.primary,
                  transform: 'rotate(90deg)',
                }}
              />
            </IconButton>
          </ToggleContent>
        </ConverterFrame>
      </OverviewWrapper>

      <Stack direction="row" alignItems="center" justifyContent="flex-start" sx={{ mt: 1, mb: 1, width: '100%' }}>
        <PulsatingCircle />
        <Typography variant="body1">
          1 SOLO = 1.45 XRP
        </Typography>
      </Stack>

      <ExchangeButton
        variant="contained"
        
        onClick={handleSwap}
        sx={{ mt: 0 }}
      >
        Connect wallet
      </ExchangeButton>
    </Stack>
  );
};

const App = () => {
  const [showSwap, setShowSwap] = useState(false);

  const toggleSwap = () => {
    setShowSwap(!showSwap);
  };

  return (
    <Stack alignItems="center" width="100%">
      <Button variant="outlined" onClick={toggleSwap} fullWidth startIcon={<Icon icon={showSwap ? hideIcon : swapIcon} />}>
        {showSwap ? 'Hide Swap' : 'Swap Now'}
      </Button>
      {showSwap && <Swap />}
    </Stack>
  );
};

export default App;
