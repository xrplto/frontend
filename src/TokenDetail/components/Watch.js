import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import { Bookmark } from 'lucide-react';

const WatchButton = styled.button`
  border-radius: 8px;
  border: 1.5px solid ${props => props.isActive ? 'rgba(246,184,126,0.3)' : (props.isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.25)')};
  background: ${props => props.isActive ? 'rgba(246,184,126,0.1)' : (props.isDark ? 'rgba(255,255,255,0.04)' : 'transparent')};
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  color: ${props => props.isActive ? '#F6B87E' : (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
  &:hover {
    border-color: ${props => props.isActive ? 'rgba(246,184,126,0.4)' : 'rgba(59,130,246,0.4)'};
    background: ${props => props.isActive ? 'rgba(246,184,126,0.15)' : 'rgba(59,130,246,0.05)'};
  }
`;

export default function Watch({ token }) {
  const BASE_URL = 'https://api.xrpl.to/v1';
  const { accountProfile, openSnackbar, setLoading, themeName, setOpenWalletModal } = useContext(AppContext);
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
      .get(`${BASE_URL}/watchlist?account=${account}`)
      .then((res) => {
        if (res.status === 200 && res.data.result === 'success') {
          setWatchList(res.data.watchlist || []);
        }
      })
      .catch(() => {});
  }, [accountProfile]);

  const onChangeWatchList = async () => {
    const account = accountProfile?.account;

    if (!account) {
      setOpenWalletModal(true);
      return;
    }

    setLoading(true);
    try {
      const action = isActive ? 'remove' : 'add';
      const res = await axios.post(`${BASE_URL}/watchlist`, { md5, account, action });

      if (res.status === 200 && res.data.result === 'success') {
        setWatchList(res.data.watchlist || []);
        openSnackbar('Watchlist updated!', 'success');
      } else {
        openSnackbar('Failed to update', 'error');
      }
    } catch (err) {}
    setLoading(false);
  };

  return (
    <WatchButton isDark={isDark} isActive={isActive} onClick={onChangeWatchList}>
      <Bookmark size={12} style={{ marginRight: 4 }} fill={isActive ? '#F6B87E' : 'none'} />
      {isActive ? 'Saved' : 'Save'}
    </WatchButton>
  );
}
