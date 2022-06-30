import PropTypes from 'prop-types';

// Material
import { withStyles } from '@mui/styles';
import {
    Stack,
    Typography
} from '@mui/material';
//import {styled, alpha, useTheme } from '@mui/material/styles';

// Utils
import { fPercent } from 'src/utils/formatNumber';

// Iconify
import { Icon } from '@iconify/react';
import caretDown from '@iconify/icons-bx/caret-down';
import caretUp from '@iconify/icons-bx/caret-up';

// ----------------------------------------------------------------------

const BearishTypography = withStyles({
    root: {
        color: "#FF6C40"
    }
})(Typography);

const BullishTypography = withStyles({
    root: {
        color: "#54D62C"
    }
})(Typography);

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
                    <BearishTypography variant='subtitle1' noWrap>{strPro}</BearishTypography>
                </span>
            ) : (
                <span>
                    <Icon icon={caretUp} color="#54D62C"/>
                    <BullishTypography variant='subtitle1' noWrap>{strPro}</BullishTypography>
                </span>
            )}
        </>
    );
}

