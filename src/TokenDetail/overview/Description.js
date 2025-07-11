import React, { useState, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Box,
  Card,
  CardHeader,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Collapse,
  useTheme,
  alpha
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { AppContext } from 'src/AppContext';

export default function Description({ 
  token, 
  showEditor, 
  setShowEditor, 
  description, 
  onApplyDescription 
}) {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const [expanded, setExpanded] = useState(false);
  
  const isAdmin = accountProfile?.admin;
  const displayName = token.user || token.name;
  
  const handleEditToggle = () => {
    if (showEditor) onApplyDescription();
    setShowEditor(!showEditor);
  };

  if (!description && !showEditor) return null;

  return (
    <Card 
      elevation={0}
      sx={{
        borderRadius: { xs: '12px', sm: '16px' },
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: `
          0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
          0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          display: 'none'
        },
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `
            0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
            0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
          border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
        }
      }}
    >
      <CardHeader
        title={`About ${displayName}`}
        titleTypographyProps={{
          variant: 'h6',
          fontWeight: 600,
          fontSize: { xs: '1rem', sm: '1.125rem' }
        }}
        action={
          <Stack direction="row" spacing={1}>
            <Tooltip title={expanded ? 'Show less' : 'Show more'}>
              <IconButton 
                size="small" 
                onClick={() => setExpanded(!expanded)}
                sx={{ 
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  borderRadius: 1
                }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
            {isAdmin && (
              <Tooltip title={showEditor ? 'Save & close' : 'Edit'}>
                <IconButton 
                  size="small" 
                  onClick={handleEditToggle}
                  sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderRadius: 1,
                    color: showEditor ? 'error.main' : 'inherit'
                  }}
                >
                  {showEditor ? <CloseIcon /> : <EditIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        }
        sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          px: { xs: 2, sm: 3 },
          py: 2
        }}
      />
      
      {!showEditor && description && (
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Collapse in={expanded} collapsedSize={120}>
            <Box 
              sx={{ 
                position: 'relative',
                ...(!expanded && {
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 60,
                    background: `linear-gradient(transparent, ${theme.palette.background.paper})`
                  }
                })
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <Typography 
                      variant="body2" 
                      paragraph
                      sx={{ 
                        color: 'text.secondary',
                        lineHeight: 1.7,
                        mb: 1.5
                      }}
                    >
                      {children}
                    </Typography>
                  ),
                  h1: ({ children }) => (
                    <Typography variant="h5" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                      {children}
                    </Typography>
                  ),
                  h2: ({ children }) => (
                    <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                      {children}
                    </Typography>
                  ),
                  h3: ({ children }) => (
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 1.5, fontWeight: 600 }}>
                      {children}
                    </Typography>
                  ),
                  ul: ({ children }) => (
                    <Box component="ul" sx={{ pl: 2, mb: 1.5 }}>
                      {children}
                    </Box>
                  ),
                  ol: ({ children }) => (
                    <Box component="ol" sx={{ pl: 2, mb: 1.5 }}>
                      {children}
                    </Box>
                  ),
                  li: ({ children }) => (
                    <Typography 
                      component="li" 
                      variant="body2"
                      sx={{ 
                        color: 'text.secondary',
                        mb: 0.5,
                        lineHeight: 1.7
                      }}
                    >
                      {children}
                    </Typography>
                  )
                }}
              >
                {description}
              </ReactMarkdown>
            </Box>
          </Collapse>
        </Box>
      )}
    </Card>
  );
}