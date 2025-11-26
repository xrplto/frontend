import { useState, useContext } from 'react';
import {
  TwitterShareButton,
  FacebookShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  RedditShareButton,
  EmailShareButton,
  TwitterIcon,
  FacebookIcon,
  TelegramIcon,
  WhatsappIcon,
  LinkedinIcon,
  RedditIcon,
  EmailIcon
} from '../../components/ShareButtons';
import styled from '@emotion/styled';
import { Share as ShareIcon, X, Copy } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectActiveFiatCurrency, selectMetrics } from 'src/redux/statusSlice';
import { fNumber } from 'src/utils/formatters';

const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

const ShareButton = styled.button`
  border-radius: 8px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'};
  background: transparent;
  padding: 5px;
  min-width: 28px;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
  &:hover {
    border-color: #4285f4;
    background: rgba(66,133,244,0.04);
    color: #4285f4;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)'};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
`;

const DialogBox = styled.div`
  background: ${props => props.isDark ? '#0a0a0a' : '#fff'};
  border-radius: 12px;
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'};
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const DialogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
`;

const DialogTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${props => props.isDark ? '#fff' : '#212B36'};
`;

const CloseBtn = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
  &:hover {
    color: ${props => props.isDark ? '#fff' : '#000'};
  }
`;

const DialogContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const TokenAvatar = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  border: 2px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
`;

const TokenName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.isDark ? '#fff' : '#212B36'};
  text-align: center;
`;

const PriceCard = styled.div`
  width: 100%;
  padding: 12px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'};
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  border-radius: 10px;
  text-align: center;
`;

const PriceLabel = styled.div`
  font-size: 11px;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  margin-bottom: 4px;
`;

const PriceValue = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #4285f4;
`;

const SectionTitle = styled.div`
  font-size: 11px;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
  text-align: center;
`;

const SocialGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`;

const SocialIconWrapper = styled.div`
  border-radius: 10px;
  overflow: hidden;
  &:hover {
    opacity: 0.8;
  }
`;

const UrlBox = styled.div`
  width: 100%;
  padding: 10px 12px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'};
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UrlText = styled.div`
  flex: 1;
  font-size: 12px;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CopyBtn = styled.button`
  border: 1.5px solid rgba(66,133,244,0.2);
  background: rgba(66,133,244,0.08);
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  color: #4285f4;
  display: flex;
  align-items: center;
  &:hover {
    background: rgba(66,133,244,0.15);
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
`;

export default function Share({ token }) {
  const { openSnackbar, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const metrics = useSelector(selectMetrics);
  const activeFiatCurrency = useSelector(selectActiveFiatCurrency);

  const [open, setOpen] = useState(false);

  const { name, md5, exch } = token;
  const user = token.user || name;
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  const getCleanUrl = () => {
    if (typeof window === 'undefined') return '';
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('fromSearch');
    return currentUrl.toString();
  };

  const url = getCleanUrl();

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      openSnackbar('Link copied!', 'success');
    });
  };

  const socialPlatforms = [
    { Component: TwitterShareButton, Icon: TwitterIcon, props: { title: `${user} ${name}`, url } },
    { Component: FacebookShareButton, Icon: FacebookIcon, props: { url } },
    { Component: LinkedinShareButton, Icon: LinkedinIcon, props: { url, title: `${user} ${name}` } },
    { Component: WhatsappShareButton, Icon: WhatsappIcon, props: { url, title: `${user} ${name}` } },
    { Component: TelegramShareButton, Icon: TelegramIcon, props: { url, title: `${user} ${name}` } },
    { Component: RedditShareButton, Icon: RedditIcon, props: { url, title: `${user} ${name}` } },
    { Component: EmailShareButton, Icon: EmailIcon, props: { subject: `${user} ${name}`, body: `Check out: ${url}` } }
  ];

  return (
    <>
      <ShareButton isDark={isDark} onClick={() => setOpen(true)}>
        <ShareIcon size={14} />
      </ShareButton>

      {open && (
        <Overlay isDark={isDark} onClick={() => setOpen(false)}>
          <DialogBox isDark={isDark} onClick={e => e.stopPropagation()}>
            <DialogHeader isDark={isDark}>
              <DialogTitle isDark={isDark}>Share {user}</DialogTitle>
              <CloseBtn isDark={isDark} onClick={() => setOpen(false)}>
                <X size={18} />
              </CloseBtn>
            </DialogHeader>

            <DialogContent>
              <TokenAvatar src={imgUrl} alt={name} isDark={isDark} />
              <TokenName isDark={isDark}>{user} {name}</TokenName>

              <PriceCard isDark={isDark}>
                <PriceLabel isDark={isDark}>Current Price</PriceLabel>
                <PriceValue>
                  {currencySymbols[activeFiatCurrency]}
                  {fNumber(exch / (metrics[activeFiatCurrency] || 1))}
                </PriceValue>
              </PriceCard>

              <Divider isDark={isDark} />

              <SectionTitle isDark={isDark}>Share on</SectionTitle>
              <SocialGrid>
                {socialPlatforms.map(({ Component, Icon, props }, i) => (
                  <SocialIconWrapper key={i}>
                    <Component {...props}>
                      <Icon size={36} round isDark={isDark} />
                    </Component>
                  </SocialIconWrapper>
                ))}
              </SocialGrid>

              <Divider isDark={isDark} />

              <SectionTitle isDark={isDark}>Copy Link</SectionTitle>
              <UrlBox isDark={isDark}>
                <UrlText isDark={isDark}>{url}</UrlText>
                <CopyBtn onClick={handleCopy}>
                  <Copy size={14} />
                </CopyBtn>
              </UrlBox>
            </DialogContent>
          </DialogBox>
        </Overlay>
      )}
    </>
  );
}
