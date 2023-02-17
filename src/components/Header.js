import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Material
import {
    alpha,
    Box,
    Container,
    IconButton,
    Link,
    styled,
    Stack,
    Tooltip
} from '@mui/material';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';

// Iconify Icons
import { Icon } from '@iconify/react';
import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';
import fiatIcon from '@iconify/icons-simple-icons/fiat';

// Utils

// Components
import Logo from 'src/components/Logo';
import Account from 'src/components/Account';

const HeaderWrapper = styled(Box)(
    ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(10)};
    margin-bottom: ${theme.spacing(0)};
    border-radius: 0px;
    border-bottom: 1px solid ${alpha('#CBCCD2', 0.2)};
`
);

export default function Header(props) {
    const { toggleTheme, darkMode } = useContext(AppContext);
    const data = props.data;

    return (
        <HeaderWrapper>
            <Container maxWidth="xl">
                <Box display="flex" alignItems="center" justifyContent="space-between" flex={2} sx={{pl:0, pr:0}}>
                    <Box>
                        <Logo />
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
                        <Link
                            href="/buy-crypto"
                            rel="noreferrer noopener nofollow"
                        >
                            <Tooltip title="Buy crypto">
                                <IconButton> <CurrencyExchangeIcon /> </IconButton>
                            </Tooltip>
                        </Link>
                        <Account />
                        <IconButton onClick={() => { toggleTheme() }} >
                            {darkMode ? (
                                <Icon icon={baselineBrightnessHigh} />
                            ) : (
                                <Icon icon={baselineBrightness4} />
                            )}
                        </IconButton>
                    </Stack>
                </Box>
            </Container>
        </HeaderWrapper>
    );
}
