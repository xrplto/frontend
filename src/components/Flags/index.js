import React from 'react';
import { Stack, Tooltip, Typography } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockIcon from '@mui/icons-material/Lock';

const FlagIcon = ({ IconComponent, tooltip }) => (
  <Tooltip title={tooltip}>
    <IconComponent sx={{ fontSize: '24px' }} />
  </Tooltip>
);

export default function FlagsContainer({ Flags }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {Flags & 1 && <FlagIcon IconComponent={SwapHorizIcon} tooltip="Transferable" />}
      {Flags & 2 && <FlagIcon IconComponent={MonetizationOnIcon} tooltip="Only XRP" />}
      {Flags & 4 && <FlagIcon IconComponent={VpnKeyIcon} tooltip="TrustLine Required" />}
      {Flags & 8 && <FlagIcon IconComponent={LockIcon} tooltip="Burnable" />}
    </Stack>
  );
}