import { useState } from 'react';

// Material
import {
    alpha, styled, useMediaQuery, useTheme,
    Box,
    Container,
    IconButton,
    Link,
    Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';

// Iconify Icons

// Context

// Components
import Logo from 'src/components/Logo';
import Wallet from 'src/components/Wallet';
import NavSearchBar from './NavSearchBar';
import Drawer from './Drawer';
import ThemeSwitcher from './ThemeSwitcher';

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
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    // const data = props.data;

    const [fullSearch, setFullSearch] = useState(false);
    const [drawer, setDrawer] = useState(false);

    const handleFullSearch = (e) => {
        setFullSearch(true);
    }

    const toggleDrawer = (isOpen = true) => {
        setDrawer(isOpen);
    }

    return (
        <HeaderWrapper>
            <Container maxWidth="xl">
                <Box display="flex" alignItems="center" justifyContent="space-between" flex={2} sx={{pl:0, pr:0}}>
                    <Box id='logo-container-laptop'
                        sx={{
                            mr: 2,
                            display: { xs: 'none', sm: 'flex' },
                            alignItems: 'center',
                            "& .MuiLink-root": {
                                "&:hover": {
                                    color: "#6188ff"
                                }
                            }
                        }}
                    >
                        <Logo style={{ marginRight: 25 }} />

                        {!isTablet &&
                            <>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    href="https://xrpl.to"
                                    style={{ marginRight: 27, fontWeight: 600 }}>Tokens</Link>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    href="/swap"
                                    style={{ marginRight: 27, fontWeight: 600 }}>Swap</Link>
                                <Link
                                    underline="none"
                                    color="inherit"
                                    href="/buy-xrp"
                                    style={{ fontWeight: 600 }}>Fiat</Link>
                            </>
                        }
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
                        {!fullSearch && !isTablet &&
                            <Stack mr={2}>
                                <NavSearchBar
                                    id='id_search_tokens'
                                    placeholder='Search'
                                    fullSearch={fullSearch}
                                    setFullSearch={setFullSearch}
                                />
                            </Stack>
                        }

                        {!fullSearch && isTablet &&
                            <IconButton
                                aria-label='search'
                                onClick={handleFullSearch}
                            >
                                <SearchIcon />
                            </IconButton>
                        }

                        {!fullSearch && !isTablet &&
                            <Wallet />
                        }

                        {!isMobile &&
                            <ThemeSwitcher />
                        }

                        {isTablet && !fullSearch &&
                            <IconButton onClick={() => toggleDrawer(true)}>
                                <MenuIcon />
                            </IconButton>
                        }
                        
                        <Drawer
                            toggleDrawer={toggleDrawer}
                            isOpen={drawer}
                        />
                    </Box>
                </Box>
            </Container>
        </HeaderWrapper>
    );
}
