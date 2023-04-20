import { LazyLoadImage } from 'react-lazy-load-image-component';

// Material
import {
    alpha,
    Box,
    Container,
    Grid,
    Link,
    Stack,
    styled,
    Typography
} from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// const FooterWrapper = styled(Container)(
//     ({ theme }) => `
//         margin-top: ${theme.spacing(4)};
// `
// );

const FooterWrapper = styled(Box)(
    ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    margin-bottom: ${theme.spacing(0)};
`
);

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

function Footer() {
    const { darkMode } = useContext(AppContext);

    const img_black = "/logo/xrpl-to-logo-black.svg";
    const img_white = "/logo/xrpl-to-logo-white.svg";

    const img = darkMode?img_white:img_black;
    return (
        <FooterWrapper>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
                <Grid container sx={{ml:5}}>
                    <Grid item xs={12} md={5} lg={5} sx={{ mt: 3 }}>
                        <Link
                            href="/"
                            sx={{ pl: 0, pr: 0, py: 3, display: 'inline-flex' }}
                            underline="none"
                            rel="noreferrer noopener nofollow"
                        >
                            {/* <Box component="img" src={img} sx={{ height: 46 }} /> */}
                            <LazyLoadImage
                                src={img}
                                width={125}
                                height={46}
                            />
                        </Link>
                    </Grid>

                    <Grid item xs={12} md={7} lg={7} sx={{ mt: 3 }}>
                        <Grid container>
                            <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                                <Stack>
                                    <Typography variant='h6'>Products</Typography>
                                    <Link
                                        href="https://xrpscan.com/"
                                        sx={{ mt: 2, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>XRP Ledger Explorer</Typography>
                                    </Link>
                                    <Link
                                        href="/swap"
                                        sx={{ mt: 2, display: 'inline-flex' }}
                                        underline="none"
                                        // target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Token Swap</Typography>
                                    </Link>
                                    <Link
                                        href="/buy-xrp"
                                        sx={{ mt: 2, display: 'inline-flex' }}
                                        underline="none"
                                        // target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Buy XRP</Typography>
                                    </Link>
                                    <Link
                                        href="https://docs.xrpl.to"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Token API</Typography>
                                    </Link>
                                    <Link
                                        href="https://jobs.xrpl.org/jobs"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Job Board</Typography>
                                    </Link>
                                    <Link
                                        href="/sitemap/token.xml"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Sitemap</Typography>
                                    </Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                                <Stack>
                                    <Typography variant='h6'>Company</Typography>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 2, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>About us</Typography>
                                    </Link>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Terms of use</Typography>
                                    </Link>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Privacy Policy</Typography>
                                    </Link>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Community Rules</Typography>
                                    </Link>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Disclaimer</Typography>
                                    </Link>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Methodology</Typography>
                                    </Link>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Careers</Typography>
                                    </Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                                <Stack>
                                    <Typography variant='h6'>Support</Typography>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 2, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Request Form</Typography>
                                    </Link>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Contact Support</Typography>
                                    </Link>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>FAQ</Typography>
                                    </Link>
                                    <Link
                                        href="/status/coming-soon"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Glossary</Typography>
                                    </Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={6} sm={6} md={3} lg={3} sx={{ mt: 3 }}>
                                <Stack>
                                    <Typography variant='h6'>Socials</Typography>
                                    <Link
                                        href="https://www.facebook.com/xrpl.to/"
                                        sx={{ mt: 2, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Facebook</Typography>
                                    </Link>
                                    <Link
                                        href="https://t.me/xrplto/"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Telegram</Typography>
                                    </Link>
                                    <Link
                                        href="https://www.instagram.com/xrpl.to/"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Instagram</Typography>
                                    </Link>
                                    <Link
                                        href="https://www.reddit.com/r/xrplto/"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Reddit</Typography>
                                    </Link>
                                    <Link
                                        href="https://xrpl.to/discord"
                                        sx={{ mt: 1.5, display: 'inline-flex' }}
                                        underline="none"
                                        target="_blank"
                                        rel="noreferrer noopener nofollow"
                                    >
                                        <Typography variant='link'>Interactive Chat</Typography>
                                    </Link>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 3 }}>
                        <Typography textAlign="left" variant="subtitle1">
                            &copy; 2023 XRPL.to. All rights reserved
                            {/* <Link
                                href="https://nftlabs.to"
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                sx={{ml:1}}
                            >
                                NFT Labs
                            </Link> */}
                        </Typography>
                    </Grid>
                </Grid>
            </Container>
        </FooterWrapper>
    );
}

export default Footer;
