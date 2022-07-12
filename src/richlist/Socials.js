
// Material
import {
    Avatar,
    IconButton,
    Link
} from '@mui/material';

// ----------------------------------------------------------------------
export default function Socials({social}) {

    return (
        <>
            {social && social.telegram && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://t.me/${social.telegram}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="telegram" src="/static/telegram.png" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
            {social && social.discord && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://discord.gg/${social.discord}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="discord" src="/static/discord.png" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
            {social && social.twitter && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://twitter.com/${social.twitter}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="twitter" src="/static/twitter.png" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
            {social && social.facebook && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://facebook.com/${social.facebook}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="facebook" src="/static/facebook.png" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
            {social && social.linkedin && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://linkedin.com/${social.linkedin}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="linkedin" src="/static/linkedin.png" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
            {social && social.instagram && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://instagram.com/${social.instagram}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="instagram" src="/static/instagram.png" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
            {social && social.youtube && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://youtube.com/${social.youtube}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="youtube" src="/static/youtube.png" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
            {social && social.medium && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://medium.com/${social.medium}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="medium" src="/static/medium.png" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
            {social && social.twitch && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://twitch.tv/${social.twitch}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="twitch" src="/static/twitch.png" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
            {social && social.tiktok && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://tiktok.com/${social.tiktok}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="tiktok" src="/static/tiktok.png" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
            {social && social.reddit && (
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://www.reddit.com/${social.reddit}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="reddit" src="/static/reddit.svg" sx={{ width: 24, height: 24 }} />
                    </IconButton>
                </Link>
            )}
        </>
    );
}
