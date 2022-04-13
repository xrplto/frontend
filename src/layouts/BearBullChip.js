import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { Icon } from '@iconify/react';
import caretDown from '@iconify/icons-bx/caret-down';
import caretUp from '@iconify/icons-bx/caret-up';
// material
import { Chip, Tooltip, Typography } from '@mui/material';
//import {styled, alpha, useTheme } from '@mui/material/styles';
import { fPercent } from '../utils/formatNumber';
// ----------------------------------------------------------------------

const BearishChip = withStyles({
    root: {
        backgroundColor: "#B72136"
    }
})(Chip);

const BullishChip = withStyles({
    root: {
        backgroundColor: "#007B55"
    }
})(Chip);

const WhiteTextTypography = withStyles({
    root: {
        color: "#FFFFFF"
    }
})(Typography);

BearBullChip.propTypes = {
    value: PropTypes.number,
    tooltip: PropTypes.any
};

export default function BearBullChip({value, tooltip}) {
    const pro = fPercent(value);

    let strPro = 0;
    if (pro < 0) {
        strPro = -pro;
        strPro = strPro + ' %';
    } else {
        strPro = pro + ' %';
    }
    return (
        <Tooltip title={tooltip}>
            {pro < 0 ? (
                <BearishChip
                    icon={<Icon icon={caretDown} width="16" height="16" color='#fff'/>}
                    size="small"
                    label={<WhiteTextTypography variant="subtitle2">{strPro}</WhiteTextTypography>}
                    variant="h3" />
            ) : (
                <BullishChip
                    icon={<Icon icon={caretUp} width="16" height="16" color='#fff'/>}
                    size="small"
                    label={<WhiteTextTypography variant="subtitle2">{strPro}</WhiteTextTypography>}
                    variant="h3" />
            )}
        </Tooltip>
    );
}

