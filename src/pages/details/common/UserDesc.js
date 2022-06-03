import { useState } from 'react';

import {
    Token as TokenIcon
} from '@mui/icons-material';

import {
    Avatar,
    Chip,
    Rating,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

export default function UserDesc({token}) {
    const [rating, setRating] = useState(2);

    const {
        id,
        name,
        kyc,
        holders,
        offers,
    } = token;

    const imgUrl = `/static/tokens/${name.replace(/[^a-zA-Z0-9]/g, "")}.jpg`;
  
    let user = token.user;
    if (!user) user = name;

    return (
        <Stack>
            <Stack direction="row" spacing={1} alignItems='center'>
                <Avatar
                    alt={user}
                    src={imgUrl}
                    sx={{ width: 56, height: 56 }}
                />
                <Stack spacing={0.2}>
                    <Typography variant={"h4"}>{user}</Typography>
                    <Rating
                        name="simple-controlled"
                        value={rating}
                        onChange={(event, newValue) => {
                          setRating(newValue);
                        }}
                    />
                </Stack>
                <Chip variant={"outlined"} icon={<TokenIcon />} label={name} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{mt:2}}>
                <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">Rank by Volume(24h)</Typography>}>
                    <Chip label={'Rank #' + id} color="primary" variant="outlined" size="small"/>
                </Tooltip>
                <Chip label={holders + " Holders"} color="error" variant="outlined" size="small"/>
                <Chip label={offers + " Offers"} color="warning" variant="outlined" size="small"/>
                {kyc && (
                    <Chip label={'KYC'} color="success" variant="outlined" size="small"/>
                )}
            </Stack>
        </Stack>
    );
}
