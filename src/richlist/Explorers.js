
// Material
import {
    Avatar,
    IconButton,
    Link,
    Stack
} from '@mui/material';

// ----------------------------------------------------------------------
export default function Explorers({account}) {

    return (
        <>
            <Link
                underline="none"
                color="inherit"
                target="_blank"
                href={`https://bithomp.com/explorer/${account}`}
                rel="noreferrer noopener nofollow"
            >
                <IconButton>
                    <Avatar alt="bithomp" src="/static/bithomp.png" sx={{ width: 20, height: 20 }} />
                </IconButton>
            </Link>
            <Link
                underline="none"
                color="inherit"
                target="_blank"
                href={`https://gatehub.net/explorer/${account}`}
                rel="noreferrer noopener nofollow"
            >
                <IconButton>
                    <Avatar alt="xumm" src="/static/gatehub.jpg" sx={{ width: 20, height: 20 }} />
                </IconButton>
            </Link>
            <Link
                underline="none"
                color="inherit"
                target="_blank"
                href={`https://xrpscan.com/account/${account}`}
                rel="noreferrer noopener nofollow"
            >
                <IconButton>
                    <Avatar alt="xrpscan" src="/static/xrpscan.png" sx={{ width: 20, height: 20 }} />
                </IconButton>
            </Link>
            <Link
                underline="none"
                color="inherit"
                target="_blank"
                href={`https://explorer.xrplf.org/${account}`}
                rel="noreferrer noopener nofollow"
            >
                <IconButton>
                    <Avatar alt="xrplf" src="/static/explorerxrplf.png" sx={{ width: 20, height: 20 }} />
                </IconButton>
            </Link>
            <Link
                underline="none"
                color="inherit"
                target="_blank"
                href={`https://livenet.xrpl.org/accounts/${account}`}
                rel="noreferrer noopener nofollow"
            >
                <IconButton>
                    <Avatar alt="xrplexplorer" src="/static/livenetxrplorg.png" sx={{ width: 20, height: 20 }} />
                </IconButton>
            </Link>
            <Link
                underline="none"
                color="inherit"
                target="_blank"
                href={`https://xrplorer.com/account/${account}`}
                rel="noreferrer noopener nofollow"
            >
                <IconButton>
                    <Avatar alt="xrplorer" src="/static/xrplorer.png" sx={{ width: 20, height: 20 }} />
                </IconButton>
            </Link>
        </>
    );
}
