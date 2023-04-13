import {
    Box,
    Typography,
    Container,
    Divider,
    IconButton,
    Tooltip,
    styled
} from '@mui/material';

import Logo from 'src/components/Logo';

import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';

const MainContent = styled(Box)(
    () => `
        height: 100%;
        display: flex;
        flex: 1;
        flex-direction: column;
`
);

const TopWrapper = styled(Box)(
    ({ theme }) => `
        display: flex;
        width: 100%;
        flex: 1;
        align-items: center;
        justify-content: center;
        padding: ${theme.spacing(6)};
`
);

export default function StatusMaintenance() {
    return (
        <>
            <MainContent>
                <TopWrapper>
                    <Container maxWidth="md">
                        <Logo />
                        <Box textAlign="center">
                            <Container maxWidth="xs">
                                <Typography variant="h2" sx={{ mt: 4, mb: 2 }}>
                                Our website is temporarily unavailable due to ongoing maintenance.
                                </Typography>
                                <Typography
                                    variant="h3"
                                    color="text.secondary"
                                    fontWeight="normal"
                                    sx={{ mb: 4 }}
                                >
                                    We sincerely apologize for any inconvenience this may have caused.
                                </Typography>
                            </Container>
                            <img
                                alt="Maintenance"
                                height={250}
                                src="/static/status/maintenance.svg"
                            />
                        </Box>
                        <Divider sx={{ my: 4 }} />
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Box>
                                <Typography component="span" variant="subtitle1">
                                Be back soon. Follow us on social media.
                                </Typography>
                            </Box>
                            <Box>
    <Tooltip arrow placement="top" title="Facebook">
        <a href="https://www.facebook.com/xrpl.to">
            <IconButton color="primary">
                <FacebookIcon />
            </IconButton>
        </a>
    </Tooltip>
    <Tooltip arrow placement="top" title="Twitter">
        <a href="https://twitter.com/xrplto">
            <IconButton color="primary">
                <TwitterIcon />
            </IconButton>
        </a>
    </Tooltip>
    <Tooltip arrow placement="top" title="Instagram">
        <a href="https://www.instagram.com/xrpl.to/">
            <IconButton color="primary">
                <InstagramIcon />
            </IconButton>
        </a>
    </Tooltip>
</Box>

                        </Box>
                    </Container>
                </TopWrapper>
            </MainContent>
        </>
    );
}
