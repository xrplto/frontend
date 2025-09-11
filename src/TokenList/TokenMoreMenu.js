import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { useRef, useState, useEffect } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import styled from '@emotion/styled';

// ----------------------------------------------------------------------

const IconButton = styled.button`
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  
  &:hover {
    background-color: rgba(145, 158, 171, 0.08);
  }
`;

const Menu = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 16px 0 rgba(145, 158, 171, 0.24);
  width: 170px;
  max-width: 100%;
  z-index: 1000;
  overflow: hidden;
`;

const MenuItem = styled.a`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  text-decoration: none;
  color: rgba(145, 158, 171, 0.8);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  
  &:hover {
    background: rgba(145, 158, 171, 0.08);
  }
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  text-decoration: none;
  color: rgba(145, 158, 171, 0.8);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  text-align: left;
  
  &:hover {
    background: rgba(145, 158, 171, 0.08);
  }
  
  &.error {
    color: #FF5630;
  }
`;

const IconWrapper = styled.span`
  margin-right: 8px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const MenuWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

export default function TokenMoreMenu({ token, admin, setEditToken, setTrustToken }) {
  const ref = useRef(null);
  const menuRef = useRef(null);
  const { issuer, slug, currency } = token;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <MenuWrapper>
      <IconButton ref={ref} onClick={() => setIsOpen(true)} aria-label="More options">
        <MoreVertIcon sx={{ width: 20, height: 20 }} />
      </IconButton>

      {isOpen && (
        <Menu ref={menuRef}>
          {admin && (
            <MenuButton
              className="error"
              onClick={() => {
                setIsOpen(false);
                setEditToken(token);
              }}
            >
              <IconWrapper>
                <EditIcon sx={{ width: 24, height: 24 }} />
              </IconWrapper>
              Edit Token
            </MenuButton>
          )}

          <MenuButton
            onClick={() => {
              setIsOpen(false);
              setTrustToken(token);
            }}
          >
            <IconWrapper>
              <LinkIcon sx={{ width: 24, height: 24 }} />
            </IconWrapper>
            Trust Set
          </MenuButton>

          <MenuItem
            href={`/token/${slug}/trade`}
            target="_blank"
            rel="noreferrer noopener nofollow"
            onClick={() => setIsOpen(false)}
          >
            <IconWrapper>
              <SwapHorizIcon sx={{ width: 24, height: 24 }} />
            </IconWrapper>
            DEX Trade
          </MenuItem>
        </Menu>
      )}
    </MenuWrapper>
  );
}