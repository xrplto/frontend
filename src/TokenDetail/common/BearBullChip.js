import PropTypes from 'prop-types';
// Material
import { withStyles } from '@mui/styles';
import {
    Chip,
    Tooltip,
    Typography
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import caretDown from '@iconify/icons-bx/caret-down';
import caretUp from '@iconify/icons-bx/caret-up';

// Utils
import { fPercent } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------
const BearishChip = withStyles({
    root: {
        backgroundColor: "#B72136 !important"
    }
})(Chip);

const BullishChip = withStyles({
    root: {
        backgroundColor: "#007B55 !important"
    }
})(Chip);

const WhiteTextTypography = withStyles({
    root: {
        color: "#FFFFFF !important"
    }
})(Typography);

BearBullChip.propTypes = {
    value: PropTypes.number,
    tooltip: PropTypes.any
};

function abs(num) {
    if (num < 0)
        return -num;
    return num;
}

export default function BearBullChip({value, tooltip}) {
    let pro = fPercent(value);

    if (abs(pro) < 0.0001) pro = 0;

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
                />
            ) : (
                <BullishChip
                    icon={<Icon icon={caretUp} width="16" height="16" color='#fff'/>}
                    size="small"
                    label={<WhiteTextTypography variant="subtitle2">{strPro}</WhiteTextTypography>}
                />
            )}
        </Tooltip>
    );
}

