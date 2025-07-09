import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';

// Material
import { Box, Chip, Link, Typography, Badge } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';

import Drawer from './Drawer';
import { AppContext } from 'src/AppContext';

export default function CategoriesDrawer({ tags, isOpen, toggleDrawer, md5 }) {
  const { darkMode } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');

  // Categories to highlight - memoized to prevent recreating array
  const highlightedCategories = useMemo(
    () => ['Magnetic X', 'XPMarket', 'FirstLedger', 'LedgerMeme', 'Horizon', 'aigent.run'],
    []
  );

  // Memoize normalizeTag function to prevent recreation
  const normalizeTag = useCallback((tag) => {
    if (tag && tag.length > 0) {
      const tag1 = tag.split(' ').join('-');
      const tag2 = tag1.replace(/&/g, 'and');
      const tag3 = tag2.toLowerCase();
      const final = tag3.replace(/[^a-zA-Z0-9-]/g, '');
      return final;
    }
    return '';
  }, []);

  // Memoize isHighlighted function
  const isHighlighted = useCallback(
    (tag) => {
      return highlightedCategories.includes(tag);
    },
    [highlightedCategories]
  );

  // Memoize filtered tags to prevent unnecessary re-calculations
  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!searchTerm.trim()) return tags;
    return tags.filter((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tags, searchTerm]);

  return (
    <Drawer
      isOpen={isOpen}
      toggleDrawer={toggleDrawer}
      title={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: { xs: '8px 12px', sm: '10px 16px', md: '12px 20px' },
            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '8px', sm: '10px', md: '12px' } }}>
            <CategoryIcon sx={{ color: 'primary.main', fontSize: { xs: '1.2rem', sm: '1.35rem', md: '1.5rem' } }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
              Categories
            </Typography>
          </Box>
          {tags && tags.length > 0 && (
            <Badge 
              badgeContent={tags.length} 
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                  height: { xs: '16px', sm: '18px', md: '20px' },
                  minWidth: { xs: '16px', sm: '18px', md: '20px' }
                }
              }}
            >
              <Box sx={{ width: { xs: '20px', sm: '22px', md: '24px' }, height: { xs: '20px', sm: '22px', md: '24px' } }} />
            </Badge>
          )}
        </Box>
      }
    >
      {/* Native HTML Input Search */}
      {tags && tags.length > 0 && (
        <Box sx={{ padding: { xs: '12px', sm: '16px', md: '20px' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.75, md: 1 } }}>
            <SearchIcon color="primary" sx={{ fontSize: { xs: '1.2rem', sm: '1.35rem', md: '1.5rem' } }} />
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth < 600 ? '6px 10px' : '8px 12px',
                  border: '1px solid #ccc',
                  borderRadius: window.innerWidth < 600 ? '6px' : '8px',
                  fontSize: window.innerWidth < 600 ? '12px' : '14px',
                  outline: 'none',
                  backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                  color: darkMode ? '#fff' : '#000'
                }}
              />
            </Box>
            {searchTerm && (
              <Typography
                variant="caption"
                sx={{ 
                  cursor: 'pointer', 
                  color: 'text.secondary',
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                }}
                onClick={() => setSearchTerm('')}
              >
                Clear
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Categories List */}
      <Box
        sx={{ 
          padding: { xs: '12px', sm: '16px', md: '20px' }, 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: { xs: '8px', sm: '10px', md: '12px' }, 
          minHeight: { xs: '150px', sm: '175px', md: '200px' },
          maxHeight: { xs: '60vh', sm: '65vh', md: '70vh' },
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '3px'
          }
        }}
      >
        {tags && tags.length > 0 ? (
          filteredTags.length > 0 ? (
            filteredTags.map((tag, idx) => (
              <Link
                key={`${md5}-${idx}-${tag}`}
                href={`/view/${normalizeTag(tag)}`}
                sx={{ textDecoration: 'none' }}
                rel="noreferrer noopener nofollow"
              >
                <Chip
                  label={tag}
                  size="medium"
                  sx={{
                    borderRadius: { xs: '12px', sm: '14px', md: '16px' },
                    height: { xs: '28px', sm: '32px', md: '36px' },
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                    fontWeight: { xs: 500, sm: 550, md: 600 },
                    transition: 'all 0.3s ease',
                    backgroundColor: isHighlighted(tag) ? 'primary.main' : 'default',
                    color: isHighlighted(tag) ? 'primary.contrastText' : 'text.primary',
                    '& .MuiChip-label': {
                      px: { xs: 1.5, sm: 1.75, md: 2 }
                    },
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-1px)', md: 'translateY(-2px)' },
                      boxShadow: { xs: 2, sm: 3, md: 4 },
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText'
                    },
                    '&:active': {
                      transform: 'translateY(0)'
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
                padding: { xs: '24px 16px', sm: '36px 20px', md: '48px 24px' },
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: { xs: '12px', sm: '16px', md: '20px' }
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' } }}>
                No matching categories found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } }}>
                Try adjusting your search terms
              </Typography>
            </Box>
          )
        ) : (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              padding: { xs: '24px 16px', sm: '36px 20px', md: '48px 24px' },
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: { xs: '12px', sm: '16px', md: '20px' }
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' } }}>
              No categories available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } }}>
              Categories will appear here when available
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
