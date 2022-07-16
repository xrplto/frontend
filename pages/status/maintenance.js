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
                                    The site is currently down for maintenance
                                </Typography>
                                <Typography
                                    variant="h3"
                                    color="text.secondary"
                                    fontWeight="normal"
                                    sx={{ mb: 4 }}
                                >
                                    We apologize for any inconveniences caused
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
                                    Phone:{' '}
                                </Typography>
                                <Typography
                                    component="span"
                                    variant="subtitle1"
                                    color="text.primary"
                                >
                                    + 00 1 888 555 444
                                </Typography>
                            </Box>
                            <Box>
                                <Tooltip arrow placement="top" title="Facebook">
                                    <IconButton color="primary">
                                        <FacebookIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip arrow placement="top" title="Twitter">
                                    <IconButton color="primary">
                                        <TwitterIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip arrow placement="top" title="Instagram">
                                    <IconButton color="primary">
                                        <InstagramIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Container>
                </TopWrapper>
            </MainContent>
        </>
    );
}
