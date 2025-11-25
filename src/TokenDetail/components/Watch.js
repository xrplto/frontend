import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import styled from '@emotion/styled';
import { Star } from 'lucide-react';
import { AppContext } from 'src/AppContext';

const WatchButton = styled.button`
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
  color: ${props => props.isActive ? '#F6B87E' : (props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')};
  &:hover {
    border-color: #F6B87E;
    background: rgba(246,184,126,0.04);
    color: #F6B87E;
  }
`;

const WatchWrapper = styled.div`
  position: relative;
  display: inline-block;
  &:hover .watch-tooltip {
    opacity: 1;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: rgba(0,0,0,0.9);
  color: #fff;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  margin-bottom: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
`;

export default function Watch({ token }) {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { accountProfile, openSnackbar, setLoading, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [watchList, setWatchList] = useState([]);
  const { md5 } = token;
  const isActive = watchList.includes(md5);

  useEffect(() => {
    const account = accountProfile?.account;
    if (!account) {
      setWatchList([]);
      return;
    }
    axios
      .get(`${BASE_URL}/watchlist/get_list?account=${account}`)
      .then((res) => {
        if (res.status === 200 && res.data) {
          setWatchList(res.data.watchlist);
        }
      })
      .catch(() => {});
  }, [accountProfile]);

  const onChangeWatchList = async () => {
    const account = accountProfile?.account;
    const accountToken = accountProfile?.token;

    if (!account || !accountToken) {
      openSnackbar('Please login!', 'error');
      return;
    }

    setLoading(true);
    try {
      const action = isActive ? 'remove' : 'add';
      const res = await axios.post(
        `${BASE_URL}/watchlist/update_watchlist`,
        { md5, account, action },
        { headers: { 'x-access-token': accountToken } }
      );

      if (res.status === 200 && res.data.status) {
        setWatchList(res.data.watchlist);
        openSnackbar('Successful!', 'success');
      } else {
        openSnackbar(res.data.err, 'error');
      }
    } catch (err) {}
    setLoading(false);
  };

  return (
    <WatchWrapper>
      <Tooltip className="watch-tooltip">{isActive ? 'Remove from Watchlist' : 'Add to Watchlist'}</Tooltip>
      <WatchButton isDark={isDark} isActive={isActive} onClick={onChangeWatchList}>
        <Star size={14} fill={isActive ? '#F6B87E' : 'none'} />
      </WatchButton>
    </WatchWrapper>
  );
}
