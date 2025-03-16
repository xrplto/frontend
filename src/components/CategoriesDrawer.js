import React, { useContext, useState, useEffect } from 'react';

// Material
import { Box, Chip, Link, Typography, Badge, TextField, InputAdornment } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import Drawer from './Drawer';
import { AppContext } from 'src/AppContext';

export default function CategoriesDrawer({ tags, isOpen, toggleDrawer, md5 }) {
  const { darkMode } = useContext(AppContext);
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
      headerStyle={{
        paddingTop: '12px',
        paddingBottom: '12px',
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
      }}
      isOpen={isOpen}
      toggleDrawer={toggleDrawer}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CategoryIcon sx={{ color: darkMode ? '#fff' : '#666', fontSize: '1.25rem' }} />
          <Typography
            variant="h2"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: darkMode ? '#fff' : '#1a1a1a'
            }}
          >
            Categories
          </Typography>
          {tags && tags.length > 0 && (
            <Badge
              badgeContent={tags.length}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  height: '18px',
                  minWidth: '18px',
                  padding: '0 4px'
                }
              }}
            />
          )}
        </Box>
      }
    >
      {tags && tags.length > 0 && (
        <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <ClearIcon
                    fontSize="small"
                    color="action"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: darkMode ? '#fff' : '#000' }
                    }}
                    onClick={handleClearSearch}
                  />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'primary.main'
                },
                color: darkMode ? '#fff' : 'inherit'
              }
            }}
            sx={{
              '& .MuiInputBase-input::placeholder': {
                color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                opacity: 1
              }
            }}
          />
        </Box>
      )}

      <Box
        sx={{
          padding: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.8,
          animation: isOpen ? 'fadeIn 0.3s ease-in-out' : 'none',
          '@keyframes fadeIn': {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 }
          }
        }}
      >
        {tags && tags.length > 0 ? (
          filteredTags.length > 0 ? (
            filteredTags.map((tag, idx) => (
              <Link
                key={md5 + idx + tag}
                href={`/view/${normalizeTag(tag)}`}
                sx={{
                  textDecoration: 'none',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  }
                }}
                rel="noreferrer noopener nofollow"
              >
                <Chip
                  label={tag}
                  size="small"
                  sx={{
                    borderRadius: '12px',
                    height: '28px',
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    color: darkMode ? '#fff' : '#1a1a1a',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    padding: '0 10px',
                    transition: 'all 0.2s ease-in-out',
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'
                    }
                  }}
                />
              </Link>
            ))
          ) : (
            <Box
              sx={{
                width: '100%',
                textAlign: 'center',
                py: 3,
                color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'
              }}
            >
              <Typography variant="body2">No matching categories found</Typography>
            </Box>
          )
        ) : (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              py: 3,
              color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'
            }}
          >
            <Typography variant="body2">No categories available</Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
