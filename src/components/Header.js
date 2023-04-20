import { useState } from 'react';

// Material
import {
    alpha, styled, useMediaQuery, useTheme,
    Box,
    Container,
    IconButton,
    Link,
    Stack,
    Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import SwapVertIcon from '@mui/icons-material/SwapVert';

// Iconify Icons
import { Icon } from '@iconify/react';
import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';
import fiatIcon from '@iconify/icons-simple-icons/fiat';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import Logo from 'src/components/Logo';
import Wallet from 'src/components/Wallet';
import NavSearchBar from './NavSearchBar';

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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { toggleTheme, darkMode } = useContext(AppContext);
    // const data = props.data;

    const [fullSearch, setFullSearch] = useState(false);

    const handleFullSearch = (e) => {
        setFullSearch(true);
    }

    return (
        <HeaderWrapper>
            <Container maxWidth="xl">
                <Box display="flex" alignItems="center" justifyContent="space-between" flex={2} sx={{pl:0, pr:0}}>
                    <Box id='logo-container-laptop'
                        sx={{
                            mr: 2,
                            display: { xs: 'none', sm: 'flex' },
                        }}
                    >
                        <Logo />
                    </Box>

                    {fullSearch &&
                        <NavSearchBar
                            id='id_search_tokens'
                            placeholder='Search'
                            fullSearch={fullSearch}
                            setFullSearch={setFullSearch}
                        />
                    }

                    {!fullSearch &&
                        <Box id='logo-container-mobile'
                            sx={{
                                mr: 2,
                                display: { xs: 'flex', sm: 'none' },
                            }}
                        >
                            <Logo />
                        </Box>
                    }

                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {!fullSearch && !isMobile &&
                            <Stack mr={2}>
                                <NavSearchBar
                                    id='id_search_tokens'
                                    placeholder='Search'
                                    fullSearch={fullSearch}
                                    setFullSearch={setFullSearch}
                                />
                            </Stack>
                        }

                        {!fullSearch && isMobile &&
                            <IconButton
                                aria-label='search'
                                onClick={handleFullSearch}
                            >
                                <SearchIcon />
                            </IconButton>
                        }
                        
                        {!fullSearch &&
                            <>
                                <Link
                                    href="/swap"
                                    rel="noreferrer noopener nofollow"
                                >
                                    <Tooltip title="Swap tokens">
                                        <IconButton>
                                            <SwapVertIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Link>
                                <Link
                                    href="/buy-xrp"
                                    rel="noreferrer noopener nofollow"
                                >
                                    <Tooltip title="Buy XRP">
                                        <IconButton>
                                            <Icon icon={rippleSolid} width="20" height="20" />
                                        </IconButton>
                                    </Tooltip>
                                </Link>
                                <Wallet />
                            </>
                        }

                        {!isMobile &&
                            <IconButton onClick={() => { toggleTheme() }} >
                                {darkMode ? (
                                    <Icon icon={baselineBrightness4} />
                                ) : (
                                    <Icon icon={baselineBrightnessHigh} />
                                )}
                            </IconButton>
                        }
                    </Box>
                </Box>
            </Container>
        </HeaderWrapper>
    );
}
