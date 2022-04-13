import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
// material
import { Typography } from '@mui/material';
//import {styled, alpha, useTheme } from '@mui/material/styles';
import { fPercent } from '../utils/formatNumber';

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

BearBullChip.propTypes = {
    value: PropTypes.number,
    variant: PropTypes.string
};

export default function BearBullChip({value, variant}) {
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
                <BearishTypography variant={variant} noWrap>
                    {strPro}
                </BearishTypography>
            ) : (
                <BullishTypography variant={variant} noWrap>
                    {strPro}
                </BullishTypography>
            )}
        </>
    );
}

