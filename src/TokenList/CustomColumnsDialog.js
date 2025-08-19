import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Icon } from '@iconify/react';

const Panel = styled.div`
  width: 100%;
  max-width: 900px;
  background: ${props => props.darkMode ? '#1a1a1a' : '#fff'};
  border: 1px solid ${props => props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin: 10px auto;
`;

const Title = styled.h3`
  margin: 0 0 10px 0;
  color: ${props => props.darkMode ? '#fff' : '#000'};
  font-size: 0.95rem;
  font-weight: 600;
`;

const ColumnsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 4px;
  margin: 12px 0;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    border-radius: 3px;
  }
`;

const ColumnItem = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  background: ${props => props.checked ? (props.darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)') : props.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid ${props => props.checked ? '#2196f3' : 'transparent'};
  
  &:hover {
    background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'};
    border-color: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  }
`;

const Checkbox = styled.input`
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #2196f3;
  margin: 0;
`;

const ColumnLabel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const LabelText = styled.span`
  color: ${props => props.darkMode ? '#fff' : '#000'};
  font-size: 11px;
  font-weight: 600;
`;

const Description = styled.span`
  color: ${props => props.darkMode ? '#888' : '#666'};
  font-size: 9px;
  line-height: 1.2;
`;

const ButtonsSection = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s;
  
  &.primary {
    background: #2196f3;
    color: white;
    
    &:hover {
      background: #1976d2;
    }
  }
  
  &.secondary {
    background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
    color: ${props => props.darkMode ? '#fff' : '#000'};
    border: 1px solid ${props => props.darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};
    
    &:hover {
      background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};
    }
  }
  
  &.close {
    background: ${props => props.darkMode ? 'rgba(255, 100, 100, 0.1)' : 'rgba(255, 50, 50, 0.1)'};
    color: ${props => props.darkMode ? '#ff6666' : '#cc0000'};
    border: 1px solid ${props => props.darkMode ? 'rgba(255, 100, 100, 0.2)' : 'rgba(255, 50, 50, 0.2)'};
    
    &:hover {
      background: ${props => props.darkMode ? 'rgba(255, 100, 100, 0.2)' : 'rgba(255, 50, 50, 0.2)'};
    }
  }
`;

const MobileSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0;
`;

const DropdownGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DropdownLabel = styled.label`
  font-size: 10px;
  font-weight: 600;
  color: ${props => props.darkMode ? '#999' : '#666'};
  text-transform: uppercase;
`;

const Dropdown = styled.select`
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid ${props => props.darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};
  background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  font-size: 12px;
  cursor: pointer;
  outline: none;
  
  &:focus {
    border-color: #2196f3;
  }
  
  option {
    padding: 4px;
  }
  
  optgroup {
    font-weight: 600;
    color: ${props => props.darkMode ? '#ccc' : '#333'};
  }
`;

const AVAILABLE_COLUMNS = [
  { id: 'price', label: 'Price', mobileLabel: 'Price', description: 'Current token price' },
  { id: 'pro5m', label: '5M %', mobileLabel: '5M', description: '5 minute change' },
  { id: 'pro1h', label: '1H %', mobileLabel: '1H', description: '1 hour change' },
  { id: 'pro24h', label: '24H %', mobileLabel: '24H', description: '24 hour change' },
  { id: 'pro7d', label: '7D %', mobileLabel: '7D', description: '7 day change' },
  { id: 'pro30d', label: '30D %', mobileLabel: '30D', description: '30 day estimate' },
  { id: 'volume24h', label: 'Volume 24H', mobileLabel: 'Vol', description: '24 hour volume' },
  { id: 'volume7d', label: 'Volume 7D', mobileLabel: 'V7D', description: '7 day volume' },
  { id: 'marketCap', label: 'Market Cap', mobileLabel: 'MCap', description: 'Market capitalization' },
  { id: 'tvl', label: 'TVL', mobileLabel: 'TVL', description: 'Total Value Locked' },
  { id: 'holders', label: 'Holders', mobileLabel: 'Hldr', description: 'Number of holders' },
  { id: 'trades', label: 'Trades', mobileLabel: 'Trds', description: '24h trade count' },
  { id: 'created', label: 'Created', mobileLabel: 'Age', description: 'Token creation date' },
  { id: 'supply', label: 'Supply', mobileLabel: 'Supp', description: 'Total supply' },
  { id: 'origin', label: 'Origin', mobileLabel: 'Orig', description: 'Token origin' },
  { id: 'sparkline', label: 'Chart', mobileLabel: 'Chart', description: '24h price chart' },
];

const CustomColumnsDialog = ({ isOpen, onClose, darkMode, customColumns, setCustomColumns, isMobile }) => {
  const [selectedColumns, setSelectedColumns] = useState(customColumns || [
    'price', 'pro24h', 'volume24h', 'marketCap', 'sparkline'
  ]);
  
  // Initialize mobile columns from localStorage or customColumns
  const initMobilePrice = () => {
    if (isMobile && customColumns && customColumns[0]) return customColumns[0];
    return localStorage.getItem('mobilePriceColumn') || 'price';
  };
  
  const initMobilePercent = () => {
    if (isMobile && customColumns && customColumns[1]) return customColumns[1];
    return localStorage.getItem('mobilePercentColumn') || 'pro24h';
  };
  
  const [mobilePriceColumn, setMobilePriceColumn] = useState(initMobilePrice());
  const [mobilePercentColumn, setMobilePercentColumn] = useState(initMobilePercent());

  useEffect(() => {
    if (!isMobile) {
      setSelectedColumns(customColumns || ['price', 'pro24h', 'volume24h', 'marketCap', 'sparkline']);
    } else {
      // For mobile, sync with current values
      if (customColumns && customColumns.length >= 2) {
        setMobilePriceColumn(customColumns[0]);
        setMobilePercentColumn(customColumns[1]);
      }
    }
  }, [customColumns, isMobile]);

  const handleToggle = (columnId) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      }
      return [...prev, columnId];
    });
  };

  const handleSave = () => {
    if (isMobile) {
      // Save mobile-specific settings
      localStorage.setItem('mobilePriceColumn', mobilePriceColumn);
      localStorage.setItem('mobilePercentColumn', mobilePercentColumn);
      // Pass mobile columns to parent
      setCustomColumns([mobilePriceColumn, mobilePercentColumn]);
    } else {
      setCustomColumns(selectedColumns);
      localStorage.setItem('customTokenColumns', JSON.stringify(selectedColumns));
    }
    onClose();
  };

  const handleReset = () => {
    const defaultColumns = ['price', 'pro24h', 'volume24h', 'marketCap', 'sparkline'];
    setSelectedColumns(defaultColumns);
  };

  if (!isOpen) return null;

  // Mobile UI
  if (isMobile) {
    // Group columns by type for better organization
    const percentColumns = AVAILABLE_COLUMNS.filter(col => 
      ['pro5m', 'pro1h', 'pro24h', 'pro7d', 'pro30d'].includes(col.id)
    );
    const dataColumns = AVAILABLE_COLUMNS.filter(col => 
      ['price', 'volume24h', 'volume7d', 'marketCap', 'tvl', 'holders', 'trades', 'supply', 'created', 'origin'].includes(col.id)
    );

    return (
      <Panel darkMode={darkMode}>
        <Title darkMode={darkMode}>Mobile Column Settings</Title>
        <p style={{ 
          color: darkMode ? '#999' : '#666', 
          fontSize: '11px', 
          margin: '0 0 8px 0' 
        }}>
          Select any field for each column position
        </p>
        
        <MobileSection>
          <DropdownGroup>
            <DropdownLabel darkMode={darkMode}>Column 2 (Middle)</DropdownLabel>
            <Dropdown 
              darkMode={darkMode} 
              value={mobilePriceColumn}
              onChange={(e) => setMobilePriceColumn(e.target.value)}
            >
              <optgroup label="Data Fields">
                {dataColumns.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.mobileLabel} - {col.description}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Percent Changes">
                {percentColumns.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.mobileLabel} - {col.description}
                  </option>
                ))}
              </optgroup>
            </Dropdown>
          </DropdownGroup>
          
          <DropdownGroup>
            <DropdownLabel darkMode={darkMode}>Column 3 (Right)</DropdownLabel>
            <Dropdown 
              darkMode={darkMode}
              value={mobilePercentColumn}
              onChange={(e) => setMobilePercentColumn(e.target.value)}
            >
              <optgroup label="Percent Changes">
                {percentColumns.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.mobileLabel} - {col.description}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Data Fields">
                {dataColumns.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.mobileLabel} - {col.description}
                  </option>
                ))}
              </optgroup>
            </Dropdown>
          </DropdownGroup>
        </MobileSection>
        
        <ButtonsSection>
          <Button className="primary" onClick={handleSave}>
            Apply Changes
          </Button>
          <Button className="secondary" darkMode={darkMode} onClick={() => {
            setMobilePriceColumn('price');
            setMobilePercentColumn('pro24h');
          }}>
            Reset Default
          </Button>
          <Button className="close" darkMode={darkMode} onClick={onClose}>
            Cancel
          </Button>
        </ButtonsSection>
      </Panel>
    );
  }

  // Desktop UI - More compact with all columns visible
  return (
    <Panel darkMode={darkMode}>
      <Title darkMode={darkMode}>Customize Table Columns</Title>
      <p style={{ 
        color: darkMode ? '#999' : '#666', 
        fontSize: '11px', 
        margin: '0 0 10px 0' 
      }}>
        Select columns to display • {selectedColumns.length} selected
      </p>
      
      <ColumnsGrid darkMode={darkMode}>
        {AVAILABLE_COLUMNS.map(column => (
          <ColumnItem 
            key={column.id} 
            darkMode={darkMode}
            checked={selectedColumns.includes(column.id)}
          >
            <Checkbox
              type="checkbox"
              checked={selectedColumns.includes(column.id)}
              onChange={() => handleToggle(column.id)}
            />
            <ColumnLabel>
              <LabelText darkMode={darkMode}>{column.label}</LabelText>
              <Description darkMode={darkMode}>{column.description}</Description>
            </ColumnLabel>
          </ColumnItem>
        ))}
      </ColumnsGrid>
      
      <ButtonsSection>
        <Button className="secondary" darkMode={darkMode} onClick={handleReset}>
          Reset
        </Button>
        <Button className="close" darkMode={darkMode} onClick={onClose}>
          Cancel
        </Button>
        <Button className="primary" onClick={handleSave}>
          Apply Changes
        </Button>
      </ButtonsSection>
    </Panel>
  );
};

export default CustomColumnsDialog;