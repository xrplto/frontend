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
    () => ['Magnetic X', 'XPMarket', 'FirstLedger', 'LedgerMeme', 'xrp.fun', 'aigent.run'],
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
            padding: '12px 20px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderRadius: '12px'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CategoryIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Categories
            </Typography>
          </Box>
          {tags && tags.length > 0 && (
            <Badge badgeContent={tags.length} color="primary">
              <Box sx={{ width: '24px', height: '24px' }} />
            </Badge>
          )}
        </Box>
      }
    >
      {/* Native HTML Input Search */}
      {tags && tags.length > 0 && (
        <Box sx={{ padding: '20px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon color="primary" />
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                  color: darkMode ? '#fff' : '#000'
                }}
              />
            </Box>
            {searchTerm && (
              <Typography
                variant="caption"
                sx={{ cursor: 'pointer', color: 'text.secondary' }}
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
        sx={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', minHeight: '200px' }}
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
                    borderRadius: '16px',
                    height: '36px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    backgroundColor: isHighlighted(tag) ? 'primary.main' : 'default',
                    color: isHighlighted(tag) ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText'
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
                padding: '48px 24px',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: '20px'
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                No matching categories found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search terms
              </Typography>
            </Box>
          )
        ) : (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              padding: '48px 24px',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: '20px'
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              No categories available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categories will appear here when available
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
