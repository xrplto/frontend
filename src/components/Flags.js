// Material
import {
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

// Material UI Icons
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

export default function Flags({ Flags }) {
    return (
        <Stack direction='row' alignItems='center' justifyContent='start' sx={{ fontSize: 20, gap: 2 }}>
            {(Flags & 0x00000001) !== 0 && <Tooltip title={<Typography sx={{ color: 'white' }}>Burnable</Typography>}><LocalFireDepartmentIcon /></Tooltip>}
            {(Flags & 0x00000002) !== 0 && <Tooltip title={<Typography sx={{ color: 'white' }}>OnlyXRP</Typography>}><CurrencyExchangeIcon /></Tooltip>}
            {(Flags & 0x00000004) !== 0 && <Tooltip title={<Typography sx={{ color: 'white' }}>TrustLine</Typography>}><VerifiedUserIcon /></Tooltip>}
            {(Flags & 0x00000008) !== 0 && <Tooltip title={<Typography sx={{ color: 'white' }}>Transferable</Typography>}><SwapHorizIcon /></Tooltip>}
        </Stack>
    );
}
