import { useContext } from 'react';
import { AppContext } from 'src/contexts/AppContext';
import {
    Box,
    styled,
    useTheme
} from '@mui/material';
import Link from 'src/components/Link';

const LogoWrapper = styled(Link)(
    ({ theme }) => `
        color: ${theme.palette.text.primary};
        display: flex;
        text-decoration: none;
        width: 53px;
        margin: 0 auto;
        font-weight: ${theme.typography.fontWeightBold};
    `
);

const LogoSignWrapper = styled(Box)(
    () => `
        width: 52px;
        height: 38px;
    `
);

const LogoSign = styled(Box)(
    ({ theme }) => `
        background: ${theme.general.reactFrameworkColor};
        width: 18px;
        height: 18px;
        border-radius: ${theme.general.borderRadiusSm};
        position: relative;
        transform: rotate(45deg);
        top: 3px;
        left: 17px;

        &:after, 
        &:before {
            content: "";
            display: block;
            width: 18px;
            height: 18px;
            position: absolute;
            top: -1px;
            right: -20px;
            transform: rotate(0deg);
            border-radius: ${theme.general.borderRadiusSm};
        }

        &:before {
            background: ${theme.palette.primary.main};
            right: auto;
            left: 0;
            top: 20px;
        }

        &:after {
            background: ${theme.palette.secondary.main};
        }
    `
);

const LogoSignInner = styled(Box)(
    ({ theme }) => `
        width: 16px;
        height: 16px;
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 5;
        border-radius: ${theme.general.borderRadiusSm};
        background: ${theme.header.background};
    `
);

function Logo() {
    const theme = useTheme();

    const { darkMode } = useContext(AppContext);

    console.log(darkMode);

    const img_black = "/XRPL_Logo2_Colored_(Black).png";
    const img_white = "/XRPL_Logo2_Colored_(White).png";
    
    const img = darkMode?img_white:img_black;

    return (
        <LogoWrapper href="/">
            <Box component="img" src={img} sx={{ height: 46 }} />
        </LogoWrapper>
    );
}

export default Logo;
