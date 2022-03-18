import { useState } from 'react';

import {
    Token as TokenIcon
} from '@mui/icons-material';

import { Icon } from '@iconify/react';
//import linkChain from '@iconify/icons-akar-icons/link-chain';
import link45deg from '@iconify/icons-bi/link-45deg';
import chatIcon from '@iconify/icons-bi/chat';
import linkExternal from '@iconify/icons-charm/link-external';
import zoomIcon from '@iconify/icons-cil/zoom';
import codeIcon from '@iconify/icons-bytesize/code';
import personFill from '@iconify/icons-bi/person-fill';
import downOutlined from '@iconify/icons-ant-design/down-outlined';


import {
    Avatar,
    Chip,
    Rating,
    Stack,
    Typography
} from '@mui/material';

export default function TokenDetail({token}) {
    const [rating, setRating] = useState(2);

    const {
        id,
        name,
        /*acct,
        code,
        date,
        amt,
        trline,
        holders,
        offers,
        exch*/
    } = token;

    const imgUrl = `/static/tokens/${name}.jpg`;
  
    let user = token.user;
    if (!user) user = name;

    const handleDelete = () => {
    }

    return (
        <Stack sx={{mt:1}}>
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
                <Chip label={'Rank #' + id} color="primary" size="small"/>
                <Chip label="Token" color="success" size="small"/>
                <Chip label="On 3,634,131 watchlists" color="secondary" size="small"/>
            </Stack>
            <Stack direction="row" spacing={1} sx={{mt:5}}>
                <Chip label="www.sologenic.com"
                    deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={link45deg} width="16" height="16" />} />
                <Chip label="Explorers"
                    deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={zoomIcon} width="16" height="16" />} />
                <Chip label="Chat"
                    deleteIcon={<Icon icon={downOutlined} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={chatIcon} width="16" height="16" />} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{mt:1}}>
                <Chip label="Source code"
                    deleteIcon={<Icon icon={linkExternal} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={codeIcon} width="16" height="16" />} />
                <Chip label="Community"
                    deleteIcon={<Icon icon={downOutlined} width="16" height="16"/>}
                    onDelete={handleDelete} onClick={handleDelete}
                    icon={<Icon icon={personFill} width="16" height="16" />} />
              </Stack>
        </Stack>
    );
}
