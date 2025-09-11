import { useState, useRef, useEffect } from 'react';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import styled from '@emotion/styled';

// ----------------------------------------------------------------------
const SORT_BY_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'recent', label: 'Recent' }
];

const SortButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: inherit;
    font-family: inherit;
    
    &:hover {
        opacity: 0.8;
    }
`;

const SortLabel = styled.span`
    color: rgba(145, 158, 171, 0.8);
`;

const DropdownMenu = styled.div`
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 16px 0 rgba(145, 158, 171, 0.24);
    min-width: 140px;
    z-index: 1000;
    overflow: hidden;
`;

const MenuItem = styled.button`
    display: block;
    width: 100%;
    padding: 8px 16px;
    background: ${props => props.selected ? '#f4f6f8' : 'transparent'};
    border: none;
    cursor: pointer;
    font-size: 14px;
    text-align: left;
    color: inherit;
    font-family: inherit;
    
    &:hover {
        background: #f4f6f8;
    }
`;

const Wrapper = styled.div`
    position: relative;
    display: inline-block;
`;

export default function MarketTokenSort() {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState('all');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        setOpen(!open);
    };

    const handleSelect = (value) => {
        setSelected(value);
        setOpen(false);
    };

    return (
        <Wrapper ref={wrapperRef}>
            <SortButton onClick={handleToggle}>
                Sort By:&nbsp;
                <SortLabel>
                    {SORT_BY_OPTIONS.find(opt => opt.value === selected)?.label}
                </SortLabel>
                {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </SortButton>
            {open && (
                <DropdownMenu>
                    {SORT_BY_OPTIONS.map((option) => (
                        <MenuItem
                            key={option.value}
                            selected={option.value === selected}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.label}
                        </MenuItem>
                    ))}
                </DropdownMenu>
            )}
        </Wrapper>
    );
}