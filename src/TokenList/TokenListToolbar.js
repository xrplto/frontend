import styled from '@emotion/styled';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ViewListIcon from '@mui/icons-material/ViewList';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useSelector, useDispatch } from 'react-redux';
import { selectFilteredCount } from 'src/redux/statusSlice';
import { useCallback, memo, useState, useRef, useEffect } from 'react';
import { alpha } from '@mui/material';

// Styled Components
const StyledToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  gap: 6px;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    flex-direction: row;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 2px;
    padding: 2px;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  background: ${({ theme }) => theme.pagination?.background || theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.12)};
  box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.04)'};
  backdrop-filter: blur(10px);

  @media (max-width: 900px) {
    width: 100%;
    justify-content: center;
    padding: 2px 4px;
  }
`;

const RowsSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  background: ${({ theme }) => theme.pagination?.background || theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.12)};
  box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.04)'};
  backdrop-filter: blur(10px);

  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: center;
    padding: 4px 8px;
    gap: 2px;
  }
`;

const InfoBox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.12)};
  border-radius: 16px;
  background: ${({ theme }) => theme.pagination?.background || theme.palette.background.paper};
  box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.04)'};
  padding: 4px 8px;
  backdrop-filter: blur(10px);

  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: flex-start;
    gap: 4px;
    padding: 4px 8px;
  }
`;

const Chip = styled.span`
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.32)};
  border-radius: 6px;
  color: ${({ theme }) => theme.pagination?.textColor || theme.palette.text.primary};
`;

const Text = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.pagination?.textColor || theme.palette.text.secondary};
  font-weight: ${(props) => props.fontWeight || 500};
`;

const NavButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  padding: 0;

  &:hover:not(:disabled) {
    background: ${({ theme }) =>
      theme.pagination?.backgroundHover || alpha(theme.palette.primary.main, 0.08)};
  }

  &:disabled {
    color: ${({ theme }) => alpha(theme.pagination?.textColor || theme.palette.text.primary, 0.48)};
    cursor: not-allowed;
  }
`;

const PageButton = styled.button`
  min-width: 20px;
  height: 20px;
  border-radius: 6px;
  border: none;
  background: ${(props) =>
    props.selected
      ? props.theme.pagination?.selectedBackground || props.theme.palette.primary.main
      : 'transparent'};
  color: ${(props) =>
    props.selected ? props.theme.pagination?.selectedTextColor || 'white' : 'inherit'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  margin: 0;
  font-size: 12px;
  font-weight: ${(props) => (props.selected ? 600 : 500)};

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.selected
        ? props.theme.palette.primary.dark || '#1976D2'
        : props.theme.pagination?.backgroundHover || alpha(props.theme.palette.primary.main, 0.08)};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const Select = styled.div`
  position: relative;
  display: inline-block;
`;

const SelectButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.palette.primary.main};
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 40px;

  &:hover {
    background: ${({ theme }) => alpha(theme.palette.primary.main, 0.04)};
    border-radius: 4px;
    padding: 2px 4px;
    margin: -2px -4px;
  }
`;

const SelectMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => alpha(theme.palette.divider, 0.12)};
  border-radius: 4px;
  box-shadow: ${({ theme }) => theme.shadows?.[4] || '0 4px 12px rgba(0, 0, 0, 0.15)'};
  z-index: 1000;
  min-width: 60px;
  backdrop-filter: blur(10px);
`;

const SelectOption = styled.button`
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  color: ${({ theme }) => theme.palette.text.primary};

  &:hover {
    background: ${({ theme }) => alpha(theme.palette.action.hover, 0.04)};
  }
`;

const CenterBox = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
`;

const TokenListToolbar = memo(function TokenListToolbar({ rows, setRows, page, setPage, tokens }) {
  const filteredCount = useSelector(selectFilteredCount);
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef(null);

  const currentFilteredCount = filteredCount ?? 0;
  const num = currentFilteredCount / rows;
  let page_count = Math.floor(num);
  if (num % 1 !== 0) page_count++;
  page_count = Math.max(page_count, 1);

  const start = currentFilteredCount > 0 ? page * rows + 1 : 0;
  let end = start + rows - 1;
  if (end > currentFilteredCount) end = currentFilteredCount;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangeRows = (value) => {
    setRows(value);
    setSelectOpen(false);
  };

  const gotoTop = useCallback((event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, []);

  const handleChangePage = useCallback(
    (newPage) => {
      setPage(newPage);
      gotoTop({ target: document });
    },
    [setPage, gotoTop]
  );

  const handleFirstPage = useCallback(() => {
    setPage(0);
    gotoTop({ target: document });
  }, [setPage, gotoTop]);

  const handleLastPage = useCallback(() => {
    setPage(page_count - 1);
    gotoTop({ target: document });
  }, [setPage, gotoTop, page_count]);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const current = page + 1;
    const total = page_count;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  };

  return (
    <StyledToolbar>
      <InfoBox>
        <Chip>{`${start}-${end} of ${currentFilteredCount.toLocaleString()}`}</Chip>
        <Text>tokens</Text>
      </InfoBox>

      <CenterBox>
        <PaginationContainer>
          <NavButton onClick={handleFirstPage} disabled={page === 0} title="First page">
            <FirstPageIcon sx={{ width: 14, height: 14 }} />
          </NavButton>

          {getPageNumbers().map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', fontSize: '12px' }}>
                  ...
                </span>
              );
            }
            return (
              <PageButton
                key={pageNum}
                selected={pageNum === page + 1}
                onClick={() => handleChangePage(pageNum - 1)}
              >
                {pageNum}
              </PageButton>
            );
          })}

          <NavButton onClick={handleLastPage} disabled={page === page_count - 1} title="Last page">
            <LastPageIcon sx={{ width: 14, height: 14 }} />
          </NavButton>
        </PaginationContainer>
      </CenterBox>

      <RowsSelector>
        <ViewListIcon sx={{ width: 14, height: 14 }} />
        <Text>Rows</Text>
        <Select ref={selectRef}>
          <SelectButton onClick={() => setSelectOpen(!selectOpen)}>
            {rows}
            <ArrowDropDownIcon sx={{ width: 16, height: 16 }} />
          </SelectButton>
          {selectOpen && (
            <SelectMenu>
              <SelectOption onClick={() => handleChangeRows(100)}>100</SelectOption>
              <SelectOption onClick={() => handleChangeRows(50)}>50</SelectOption>
              <SelectOption onClick={() => handleChangeRows(20)}>20</SelectOption>
            </SelectMenu>
          )}
        </Select>
      </RowsSelector>
    </StyledToolbar>
  );
});

export default TokenListToolbar;
