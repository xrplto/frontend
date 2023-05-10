import React, { useContext } from 'react';

// Material
import {
  Box,
  Chip,
  Link,
  Typography,
  MenuItem,
  Divider,
  Avatar
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-charm/link-external';
import chatIcon from '@iconify/icons-bi/chat';
import zoomIcon from '@iconify/icons-cil/zoom';
import personFill from '@iconify/icons-bi/person-fill';

import Drawer from './Drawer';
import { AppContext } from 'src/AppContext';

export default function LinksDrawer({ isOpen, toggleDrawer, token }) {
  const { darkMode } = useContext(AppContext);

  const { issuer, domain, whitepaper, social } = token;

  const isChat = social && (social.telegram || social.discord);

  return (
    <Drawer
      headerStyle={{
        paddingTop: '10px',
        paddingBottom: '10px'
      }}
      isOpen={isOpen}
      toggleDrawer={toggleDrawer}
      title={
        <>
          <Box></Box>
          <Typography variant="h2">Links</Typography>
        </>
      }
    >
      <Box>
        {(domain || whitepaper) && (
          <>
            <Typography
              variant="h6"
              sx={{
                px: 2,
                py: 1,
                mt: 2,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Icon
                icon={link45deg}
                width="16"
                height="16"
                style={{ marginRight: 5 }}
              />
              Links
            </Typography>
            <Divider />
            {domain && (
              <Link
                underline="none"
                color="inherit"
                target="_blank"
                href={`https://${domain}`}
                rel="noreferrer noopener nofollow"
              >
                <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
                  <Icon
                    icon={link45deg}
                    width="16"
                    height="16"
                    style={{ marginRight: 5 }}
                  />
                  <Typography variant="caption" sx={{ mr: 1 }}>
                    {domain}
                  </Typography>
                  <Icon icon={linkExternal} width="16" height="16" />
                </MenuItem>
              </Link>
            )}
            {whitepaper && (
              <Link
                underline="none"
                color="inherit"
                target="_blank"
                href={`${whitepaper}`}
                rel="noreferrer noopener nofollow"
              >
                <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
                  <Icon
                    icon={paperIcon}
                    width="16"
                    height="16"
                    style={{ marginRight: 5 }}
                  />
                  <Typography variant="caption" sx={{ mr: 1 }}>
                    Whitepaper
                  </Typography>
                  <Icon icon={linkExternal} width="16" height="16" />
                </MenuItem>
              </Link>
            )}
          </>
        )}

        {isChat && (
          <>
            <Typography
              variant="h6"
              sx={{
                px: 2,
                py: 1,
                mt: 2,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Icon
                icon={chatIcon}
                width="16"
                height="16"
                style={{ marginRight: 5 }}
              />
              Chat
            </Typography>
            <Divider />

            <Link
              underline="none"
              color="inherit"
              target="_blank"
              href={`https://t.me/${social.telegram}`}
              rel="noreferrer noopener nofollow"
            >
              <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
                <Avatar
                  alt="telegram"
                  src="/static/telegram.webp"
                  sx={{ mr: '5px', width: 16, height: 16 }}
                />
                <Typography variant="caption">Telegram</Typography>
              </MenuItem>
            </Link>

            <Link
              underline="none"
              color="inherit"
              target="_blank"
              href={`https://discord.gg/${social.discord}`}
              rel="noreferrer noopener nofollow"
            >
              <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
                <Avatar
                  alt="discord"
                  src="/static/discord.webp"
                  sx={{ mr: '5px', width: 16, height: 16 }}
                />
                <Typography variant="caption">Discord</Typography>
              </MenuItem>
            </Link>
          </>
        )}

        <Typography
          variant="h6"
          sx={{
            px: 2,
            py: 1,
            mt: 2,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Icon
            icon={zoomIcon}
            width="16"
            height="16"
            style={{ marginRight: 5 }}
          />
          Explorers
        </Typography>
        <Divider />
        <Link
          underline="none"
          color="inherit"
          target="_blank"
          href={
            issuer === 'XRPL'
              ? `https://bithomp.com`
              : `https://bithomp.com/explorer/${issuer}`
          }
          rel="noreferrer noopener nofollow"
        >
          <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
            <Avatar
              alt="bithomp"
              src="/static/bithomp.webp"
              sx={{ mr: '5px', width: 16, height: 16 }}
            />
            <Typography variant="caption">Bithomp</Typography>
          </MenuItem>
        </Link>
        <Link
          underline="none"
          color="inherit"
          target="_blank"
          href={
            issuer === 'XRPL'
              ? `https://gatehub.net`
              : `https://gatehub.net/explorer/${issuer}`
          }
          rel="noreferrer noopener nofollow"
        >
          <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
            <Avatar
              alt="xumm"
              src="/static/gatehub.webp"
              sx={{ mr: '5px', width: 16, height: 16 }}
            />
            <Typography variant="caption">GateHub</Typography>
          </MenuItem>
        </Link>
        <Link
          underline="none"
          color="inherit"
          target="_blank"
          href={
            issuer === 'XRPL'
              ? `https://xrpscan.com`
              : `https://xrpscan.com/account/${issuer}`
          }
          rel="noreferrer noopener nofollow"
        >
          <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
            <Avatar
              alt="xrpscan"
              src="/static/xrpscan.webp"
              sx={{ mr: '5px', width: 16, height: 16 }}
            />
            <Typography variant="caption">XRPScan</Typography>
          </MenuItem>
        </Link>
        <Link
          underline="none"
          color="inherit"
          target="_blank"
          href={
            issuer === 'XRPL'
              ? `https://explorer.xrplf.org`
              : `https://explorer.xrplf.org/${issuer}`
          }
          rel="noreferrer noopener nofollow"
        >
          <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
            <Avatar
              alt="xrplf"
              src="/static/explorerxrplf.svg"
              sx={{ mr: '5px', width: 16, height: 16 }}
            />
            <Typography variant="caption">XRP Ledger Explorer</Typography>
          </MenuItem>
        </Link>
        <Link
          underline="none"
          color="inherit"
          target="_blank"
          href={
            issuer === 'XRPL'
              ? `https://livenet.xrpl.org`
              : `https://livenet.xrpl.org/accounts/${issuer}`
          }
          rel="noreferrer noopener nofollow"
        >
          <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
            <Avatar
              alt="xrpl"
              src="/static/livenetxrplorg.webp"
              sx={{ mr: '5px', width: 16, height: 16 }}
            />
            <Typography variant="caption">XRPL Explorer</Typography>
          </MenuItem>
        </Link>

        <Typography
          variant="h6"
          sx={{
            px: 2,
            py: 1,
            mt: 2,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Icon
            icon={personFill}
            width="16"
            height="16"
            style={{ marginRight: 5 }}
          />
          Community
        </Typography>
        <Divider />

        {social && social.twitter && (
          <Link
            underline="none"
            color="inherit"
            target="_blank"
            href={`https://twitter.com/${social.twitter}`}
            rel="noreferrer noopener nofollow"
          >
            <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
              <Avatar
                alt="twitter"
                src="/static/twitter.webp"
                sx={{ mr: '5px', width: 16, height: 16 }}
              />

              <Typography variant="caption">Twitter</Typography>
            </MenuItem>
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
            <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
              <Avatar
                alt="facebook"
                src="/static/facebook.webp"
                sx={{ mr: '5px', width: 16, height: 16 }}
              />
              <Typography variant="caption">Facebook</Typography>
            </MenuItem>
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
            <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
              <Avatar
                alt="linkedin"
                src="/static/linkedin.webp"
                sx={{ mr: '5px', width: 16, height: 16 }}
              />
              <Typography variant="caption">LinkedIn</Typography>
            </MenuItem>
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
            <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
              <Avatar
                alt="instagram"
                src="/static/instagram.webp"
                sx={{ mr: '5px', width: 16, height: 16 }}
              />
              <Typography variant="caption">Instagram</Typography>
            </MenuItem>
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
            <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
              <Avatar
                alt="youtube"
                src="/static/youtube.webp"
                sx={{ mr: '5px', width: 16, height: 16 }}
              />
              <Typography variant="caption">Youtube</Typography>
            </MenuItem>
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
            <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
              <Avatar
                alt="medium"
                src="/static/medium.webp"
                sx={{ mr: '5px', width: 16, height: 16 }}
              />
              <Typography variant="caption">Medium</Typography>
            </MenuItem>
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
            <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
              <Avatar
                alt="twitch"
                src="/static/twitch.webp"
                sx={{ mr: '5px', width: 16, height: 16 }}
              />
              <Typography variant="caption">Twitch</Typography>
            </MenuItem>
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
            <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
              <Avatar
                alt="tiktok"
                src="/static/tiktok.webp"
                sx={{ mr: '5px', width: 16, height: 16 }}
              />
              <Typography variant="caption">Tiktok</Typography>
            </MenuItem>
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
            <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
              <Avatar
                alt="reddit"
                src="/static/reddit.svg"
                sx={{ mr: '5px', width: 16, height: 16 }}
              />
              <Typography variant="caption">Reddit</Typography>
            </MenuItem>
          </Link>
        )}
        <Link
          underline="none"
          color="inherit"
          target="_blank"
          href={`https://www.xrpchat.com/`}
          rel="noreferrer noopener nofollow"
        >
          <MenuItem divider={true} sx={{ py: 1, px: 2 }}>
            <Avatar
              alt="xrpchat"
              src="/static/xrpchat.webp"
              sx={{ mr: '5px', width: 16, height: 16 }}
            />
            <Typography variant="caption">XRP Chat</Typography>
          </MenuItem>
        </Link>
      </Box>
    </Drawer>
  );
}
