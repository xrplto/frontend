import React, { useContext } from 'react';

// Material
import { Box, Chip, Link, Typography } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';

import Drawer from './Drawer';
import { AppContext } from 'src/AppContext';

export default function CategoriesDrawer({ tags, isOpen, toggleDrawer, normalizeTag, md5 }) {
  const { darkMode } = useContext(AppContext);

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
        </Box>
      }
    >
      <Box
        sx={{
          padding: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5
        }}
      >
        {tags &&
          tags.map((tag, idx) => (
            <Link
              key={md5 + idx + tag}
              href={`/view/${normalizeTag(tag)}`}
              sx={{
                textDecoration: 'none',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)'
                }
              }}
              rel="noreferrer noopener nofollow"
            >
              <Chip
                label={tag}
                size="small"
                sx={{
                  borderRadius: '12px',
                  height: '24px',
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  color: darkMode ? '#fff' : '#1a1a1a',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '0 8px',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                  }
                }}
              />
            </Link>
          ))}
      </Box>
    </Drawer>
  );
}
