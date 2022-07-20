import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Material
import { alpha } from '@mui/material/styles';
import {
    Box,
    Container,
    IconButton,
    styled,
    Stack
} from '@mui/material';

// Iconify Icons
import { Icon } from '@iconify/react';
import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';

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
                <Box display="flex" alignItems="center" justifyContent="space-between" flex={2} sx={{pl:2, pr:2}}>
                    <Box>
                        <Logo />
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
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
