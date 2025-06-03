import React, { useContext, useState, useEffect } from 'react';

// Material
import {
  Box,
  Chip,
  Link,
  Typography,
  Badge,
  TextField,
  InputAdornment,
  alpha,
  useTheme
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/material/styles';

import Drawer from './Drawer';
import { AppContext } from 'src/AppContext';

// Enhanced Search Field
const EnhancedTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
      theme.palette.background.paper,
      0.4
    )} 100%)`,
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.06)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '& fieldset': {
      border: 'none'
    },
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, 0.08)}`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
      background: `linear-gradient(135deg, ${alpha(
        theme.palette.background.paper,
        0.95
      )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
    }
  },
  '& .MuiInputBase-input': {
    fontWeight: 500,
    fontSize: '0.95rem',
    '&::placeholder': {
      opacity: 0.7,
      fontWeight: 400
    }
  }
}));

// Enhanced Category Chip
const EnhancedCategoryChip = styled(Chip)(({ theme }) => ({
  borderRadius: '16px',
  height: '36px',
  fontSize: '0.875rem',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  padding: '0 16px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.4
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}, 0 4px 12px ${alpha(
      theme.palette.common.black,
      0.08
    )}`,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
      theme.palette.primary.main,
      0.05
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    color: theme.palette.primary.main
  }
}));

// Enhanced Title Container
const TitleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '12px 20px',
  borderRadius: '16px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
    theme.palette.primary.main,
    0.04
  )} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
  minHeight: '56px',
  justifyContent: 'space-between'
}));

// Enhanced Badge
const EnhancedBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    fontSize: '0.75rem',
    height: '24px',
    minWidth: '24px',
    padding: '0 8px',
    fontWeight: 600,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
    border: `2px solid ${theme.palette.background.paper}`,
    position: 'relative',
    transform: 'scale(1) translate(0, 0)'
  }
}));

// Enhanced Search Container
const SearchContainer = styled(Box)(({ theme }) => ({
  padding: '20px 24px 16px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(
    theme.palette.background.paper,
    0.3
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`
}));

// Enhanced Categories Container
const CategoriesContainer = styled(Box)(({ theme }) => ({
  padding: '24px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.4)} 0%, ${alpha(
    theme.palette.background.default,
    0.2
  )} 100%)`,
  minHeight: '200px',
  animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '@keyframes fadeIn': {
    '0%': {
      opacity: 0,
      transform: 'translateY(20px)'
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)'
    }
  }
}));

// Enhanced Empty State
const EmptyStateContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  textAlign: 'center',
  padding: '48px 24px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(
    theme.palette.background.paper,
    0.3
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
  '& .MuiTypography-root': {
    color: alpha(theme.palette.text.secondary, 0.8),
    fontWeight: 500
  }
}));

export default function CategoriesDrawer({ tags, isOpen, toggleDrawer, md5 }) {
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTags, setFilteredTags] = useState([]);

  // Update filtered tags when search term or tags change
  useEffect(() => {
    if (!tags) {
      setFilteredTags([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredTags(tags);
      return;
    }

    const filtered = tags.filter((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredTags(filtered);
  }, [searchTerm, tags]);

  // Define normalizeTag function within the component
  const normalizeTag = (tag) => {
    if (tag && tag.length > 0) {
      const tag1 = tag.split(' ').join('-'); // Replace space
      const tag2 = tag1.replace(/&/g, 'and'); // Replace &
      const tag3 = tag2.toLowerCase(); // Make lowercase
      const final = tag3.replace(/[^a-zA-Z0-9-]/g, '');
      return final;
    }
    return '';
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <Drawer
      isOpen={isOpen}
      toggleDrawer={toggleDrawer}
      title={
        <TitleContainer>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CategoryIcon
              sx={{
                color: theme.palette.primary.main,
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: theme.palette.text.primary,
                letterSpacing: '-0.02em',
                background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.8
                )} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Categories
            </Typography>
          </Box>
          {tags && tags.length > 0 && (
            <EnhancedBadge badgeContent={tags.length} color="primary">
              <Box sx={{ width: '24px', height: '24px' }} />
            </EnhancedBadge>
          )}
        </TitleContainer>
      }
    >
      {tags && tags.length > 0 && (
        <SearchContainer>
          <EnhancedTextField
            fullWidth
            size="medium"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      fontSize: '20px',
                      color: alpha(theme.palette.primary.main, 0.7)
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <ClearIcon
                    sx={{
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: alpha(theme.palette.text.secondary, 0.7),
                      transition: 'all 0.2s ease',
                      borderRadius: '50%',
                      padding: '2px',
                      '&:hover': {
                        color: theme.palette.error.main,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        transform: 'scale(1.1)'
                      }
                    }}
                    onClick={handleClearSearch}
                  />
                </InputAdornment>
              )
            }}
          />
        </SearchContainer>
      )}

      <CategoriesContainer>
        {tags && tags.length > 0 ? (
          filteredTags.length > 0 ? (
            filteredTags.map((tag, idx) => (
              <Link
                key={md5 + idx + tag}
                href={`/view/${normalizeTag(tag)}`}
                sx={{
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
                rel="noreferrer noopener nofollow"
              >
                <EnhancedCategoryChip label={tag} size="medium" />
              </Link>
            ))
          ) : (
            <EmptyStateContainer>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                No matching categories found
              </Typography>
              <Typography variant="body2">Try adjusting your search terms</Typography>
            </EmptyStateContainer>
          )
        ) : (
          <EmptyStateContainer>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              No categories available
            </Typography>
            <Typography variant="body2">Categories will appear here when available</Typography>
          </EmptyStateContainer>
        )}
      </CategoriesContainer>
    </Drawer>
  );
}
