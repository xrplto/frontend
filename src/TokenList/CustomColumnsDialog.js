import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Icon } from '@iconify/react';

const Panel = styled.div`
  width: 100%;
  background: ${props => props.darkMode ? '#1a1a1a' : '#fff'};
  border: 1px solid ${props => props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  padding: 20px;
  gap: 20px;
  flex-wrap: wrap;
  margin: 20px;
`;

const LeftSection = styled.div`
  flex: 1;
  min-width: 250px;
`;

const Title = styled.h3`
  margin: 0 0 15px 0;
  color: ${props => props.darkMode ? '#fff' : '#000'};
  font-size: 1rem;
  font-weight: 600;
`;

const ColumnsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  flex: 2;
`;

const ColumnItem = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  
  &:hover {
    background: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'};
    border-color: ${props => props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #2196f3;
`;

const ColumnLabel = styled.span`
  flex: 1;
  color: ${props => props.darkMode ? '#fff' : '#000'};
  font-size: 13px;
  font-weight: 500;
`;

const Description = styled.span`
  color: ${props => props.darkMode ? '#999' : '#666'};
  font-size: 11px;
`;

const ButtonsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 120px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
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

const AVAILABLE_COLUMNS = [
  { id: 'price', label: 'Price', description: 'Current token price' },
  { id: 'pro5m', label: '5M %', description: '5 minute change' },
  { id: 'pro1h', label: '1H %', description: '1 hour change' },
  { id: 'pro24h', label: '24H %', description: '24 hour change' },
  { id: 'pro7d', label: '7D %', description: '7 day change' },
  { id: 'pro30d', label: '30D %', description: '30 day estimate' },
  { id: 'volume24h', label: 'Volume 24H', description: '24 hour volume' },
  { id: 'volume7d', label: 'Volume 7D', description: '7 day volume' },
  { id: 'marketCap', label: 'Market Cap', description: 'Market capitalization' },
  { id: 'tvl', label: 'TVL', description: 'Total Value Locked' },
  { id: 'holders', label: 'Holders', description: 'Number of holders' },
  { id: 'trades', label: 'Trades', description: '24h trade count' },
  { id: 'created', label: 'Created', description: 'Token creation date' },
  { id: 'supply', label: 'Supply', description: 'Total supply' },
  { id: 'origin', label: 'Origin', description: 'Token origin' },
  { id: 'sparkline', label: 'Chart', description: '24h price chart' },
];

const CustomColumnsDialog = ({ isOpen, onClose, darkMode, customColumns, setCustomColumns }) => {
  const [selectedColumns, setSelectedColumns] = useState(customColumns || [
    'price', 'pro24h', 'volume24h', 'marketCap', 'sparkline'
  ]);

  useEffect(() => {
    setSelectedColumns(customColumns || ['price', 'pro24h', 'volume24h', 'marketCap', 'sparkline']);
  }, [customColumns]);

  const handleToggle = (columnId) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      }
      return [...prev, columnId];
    });
  };

  const handleSave = () => {
    setCustomColumns(selectedColumns);
    localStorage.setItem('customTokenColumns', JSON.stringify(selectedColumns));
    onClose();
  };

  const handleReset = () => {
    const defaultColumns = ['price', 'pro24h', 'volume24h', 'marketCap', 'sparkline'];
    setSelectedColumns(defaultColumns);
  };

  if (!isOpen) return null;

  return (
    <Panel darkMode={darkMode}>
      <LeftSection>
        <Title darkMode={darkMode}>Customize Table Columns</Title>
        <p style={{ 
          color: darkMode ? '#999' : '#666', 
          fontSize: '13px', 
          margin: '0 0 15px 0' 
        }}>
          Select the columns you want to display in the token list
        </p>
      </LeftSection>
      
      <ColumnsGrid>
        {AVAILABLE_COLUMNS.map(column => (
          <ColumnItem key={column.id} darkMode={darkMode}>
            <Checkbox
              type="checkbox"
              checked={selectedColumns.includes(column.id)}
              onChange={() => handleToggle(column.id)}
            />
            <ColumnLabel darkMode={darkMode}>{column.label}</ColumnLabel>
            <Description darkMode={darkMode}>{column.description}</Description>
          </ColumnItem>
        ))}
      </ColumnsGrid>
      
      <ButtonsSection>
        <Button className="primary" onClick={handleSave}>
          Apply Changes
        </Button>
        <Button className="secondary" darkMode={darkMode} onClick={handleReset}>
          Reset Default
        </Button>
        <Button className="close" darkMode={darkMode} onClick={onClose}>
          Cancel
        </Button>
      </ButtonsSection>
    </Panel>
  );
};

export default CustomColumnsDialog;