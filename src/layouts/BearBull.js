import PropTypes from 'prop-types';

// Material
import {
    Stack,
    styled,
    Typography
} from '@mui/material';

// Utils
import { fPercent } from 'src/utils/formatNumber';

// Iconify
import { Icon } from '@iconify/react';
import caretDown from '@iconify/icons-bx/caret-down';
import caretUp from '@iconify/icons-bx/caret-up';

// ----------------------------------------------------------------------

const Bearish = styled('span') (
    () => `
        color: #FF6C40;
        font-size: 14px;
    `
);

const Bullish = styled('span') (
    () => `
        color: #54D62C;
        font-size: 14px;
    `
);

BearBull.propTypes = {
    value: PropTypes.number
};

export default function BearBull({value}) {
    const pro = fPercent(value);

    let strPro = 0;
    if (pro < 0) {
        strPro = -pro;
        strPro = strPro + ' %';
    } else {
        strPro = pro + ' %';
    }
    return (
        <>
            {pro < 0 ? (
                <span>
                    <Icon icon={caretDown} color="#FF6C40"/>
                    <Bearish>{strPro}</Bearish>
                </span>
            ) : (
                <span>
                    <Icon icon={caretUp} color="#54D62C"/>
                    <Bullish>{strPro}</Bullish>
                </span>
            )}
        </>
    );
}

