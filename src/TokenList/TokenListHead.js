import { useContext, memo, useMemo } from 'react';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';

const StyledTableHead = styled.thead`
  position: sticky;
  top: ${props => props.scrollTopLength || 0}px;
  z-index: 10;
  background: transparent;
  
  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};
  }
`;

const StyledTableCell = styled.th`
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${props => props.darkMode ? '#999' : '#666'};
  padding: ${props => props.isMobile ? '16px 8px' : '16px 12px'};  // Match mobile cell padding
  border-bottom: 1px solid ${props => props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  white-space: nowrap;
  text-align: ${props => props.align || 'left'};
  width: ${props => props.width || 'auto'};
  min-width: ${props => props.width || 'auto'};
  max-width: ${props => props.width || 'auto'};
  box-sizing: border-box;
  cursor: ${props => props.sortable ? 'pointer' : 'default'};
  position: ${props => props.sticky ? 'sticky' : 'relative'};
  left: ${props => props.left || 'unset'};
  z-index: ${props => props.sticky ? 11 : 'auto'};
  background: ${props => props.sticky ? (props.darkMode ? '#121212' : '#fff') : 'transparent'};
  
  &:hover {
    color: ${props => props.sortable ? (props.darkMode ? '#fff' : '#000') : 'inherit'};
  }
  
  ${props => props.scrollLeft && props.stickyThird && `
    &::after {
      content: "";
      position: absolute;
      right: -1px;
      top: 0;
      bottom: 0;
      width: 1px;
      background: ${props.darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};
      box-shadow: 2px 0 4px rgba(0, 0, 0, 0.08);
    }
  `}
`;

const SortIndicator = styled.span`
  display: inline-block;
  margin-left: 4px;
  font-size: 0.65rem;
  color: ${props => props.active ? '#2196f3' : (props.darkMode ? '#666' : '#999')};
  transition: transform 0.2s;
  transform: ${props => props.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const MOBILE_TABLE_HEAD = [
  {
    id: 'token',
    label: 'TOKEN',
    align: 'left',
    width: '60%',  // Match the row width
    order: true,
    sticky: false,
    mobileHide: false
  },
  {
    id: 'exch',
    label: 'PRICE',
    align: 'right',
    width: '20%',  // Match the row width
    order: true,
    sticky: false,
    mobileHide: false
  },
  {
    id: 'pro24h',
    label: '24H %',
    align: 'right',
    width: '20%',  // Match the row width
    order: true,
    sticky: false,
    mobileHide: false,
    tooltip: '24 hour change'
  }
];

const DESKTOP_TABLE_HEAD = [
  { 
    id: 'star', 
    label: '', 
    align: 'center', 
    width: '40px', 
    order: false,
    sticky: false,
    mobileHide: true
  },
  {
    id: 'rank',
    label: '#',
    align: 'center',
    width: '40px',
    order: false,
    sticky: false,
    mobileHide: true
  },
  {
    id: 'token',
    label: 'TOKEN',
    align: 'left',
    width: '250px',
    order: true,
    sticky: false,
    mobileHide: false
  },
  {
    id: 'exch',
    label: 'PRICE',
    align: 'right',
    width: '8%',
    order: true,
    sticky: false,
    mobileHide: false
  },
  {
    id: 'pro5m',
    label: '5M %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '5 minute change'
  },
  {
    id: 'pro1h',
    label: '1H %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '1 hour change'
  },
  {
    id: 'pro24h',
    label: '24H %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: false,
    tooltip: '24 hour change'
  },
  {
    id: 'pro7d',
    label: '7D %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '7 day change'
  },
  {
    id: 'vol24hxrp',
    label: 'VOLUME',
    align: 'right',
    width: '8%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '24h volume in XRP'
  },
  {
    id: 'dateon',
    label: 'CREATED',
    align: 'right',
    width: '8%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Token creation date'
  },
  {
    id: 'vol24htx',
    label: 'TRADES',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '24h trade count'
  },
  {
    id: 'tvl',
    label: 'TVL',
    align: 'right',
    width: '10%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Total Value Locked'
  },
  {
    id: 'marketcap',
    label: 'MARKET CAP',
    align: 'right',
    width: '10%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Market capitalization'
  },
  {
    id: 'holders',
    label: 'HOLDERS',
    align: 'right',
    width: '10%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Number of holders'
  },
  {
    id: 'supply',
    label: 'SUPPLY',
    align: 'right',
    width: '13%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Circulating supply'
  },
  {
    id: 'historyGraph',
    label: 'LAST 24H',
    align: 'right',
    width: '15%',
    order: false,
    sticky: false,
    mobileHide: true
  },
];

const Tooltip = styled.div`
  position: relative;
  display: inline-block;
  
  &:hover .tooltip-content {
    visibility: visible;
    opacity: 1;
  }
  
  .tooltip-content {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 9999;
    transition: opacity 0.3s;
    pointer-events: none;
    
    &:after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
    }
  }
`;

const TokenListHead = memo(function TokenListHead({
  order,
  orderBy,
  onRequestSort,
  scrollLeft,
  tokens = [],
  scrollTopLength,
  darkMode,
  isMobile,
  isLoggedIn = false
}) {
  const createSortHandler = useMemo(
    () => (id, no) => (event) => {
      onRequestSort(event, id, no);
    },
    [onRequestSort]
  );

  const getStickyLeft = useMemo(() => (id) => {
    return 'unset'; // No sticky columns anymore
  }, []);

  const TABLE_HEAD = isMobile ? MOBILE_TABLE_HEAD : DESKTOP_TABLE_HEAD;
  
  // Filter out star column if user is not logged in
  const filteredTableHead = TABLE_HEAD.filter(headCell => {
    if (headCell.id === 'star' && !isLoggedIn) return false;
    return true;
  });

  return (
    <StyledTableHead scrollTopLength={scrollTopLength} darkMode={darkMode}>
      <tr>
        {filteredTableHead.map((headCell) => {
          const isSticky = headCell.sticky && (!isMobile || !headCell.mobileHide);
          
          return (
            <StyledTableCell
              key={headCell.id}
              align={headCell.align}
              width={headCell.width}
              darkMode={darkMode}
              isMobile={isMobile}
              sortable={headCell.order}
              sticky={isSticky}
              left={isSticky ? getStickyLeft(headCell.id) : 'unset'}
              stickyThird={headCell.id === 'token'}
              scrollLeft={scrollLeft && headCell.id === 'token'}
              onClick={headCell.order ? createSortHandler(headCell.id, headCell.no) : undefined}
              style={{
                // DEBUG: Add colored borders for mobile
                border: isMobile ? (
                  headCell.id === 'token' ? '1px solid cyan' :
                  headCell.id === 'exch' ? '1px solid yellow' :
                  headCell.id === 'pro24h' ? '1px solid magenta' : undefined
                ) : (
                  headCell.id === 'star' ? '1px solid red' :
                  headCell.id === 'rank' ? '1px solid blue' :
                  headCell.id === 'token' ? '1px solid green' : undefined
                )
              }}
            >
              {headCell.order ? (
                headCell.tooltip ? (
                  <Tooltip>
                    <span>
                      {headCell.label}
                      {orderBy === headCell.id && (
                        <SortIndicator 
                          active={true} 
                          direction={order} 
                          darkMode={darkMode}
                        >
                          ▼
                        </SortIndicator>
                      )}
                    </span>
                    <span className="tooltip-content">{headCell.tooltip}</span>
                  </Tooltip>
                ) : (
                  <span>
                    {headCell.label}
                    {orderBy === headCell.id && (
                      <SortIndicator 
                        active={true} 
                        direction={order} 
                        darkMode={darkMode}
                      >
                        ▼
                      </SortIndicator>
                    )}
                  </span>
                )
              ) : (
                headCell.label
              )}
            </StyledTableCell>
          );
        })}
      </tr>
    </StyledTableHead>
  );
});

export default TokenListHead;