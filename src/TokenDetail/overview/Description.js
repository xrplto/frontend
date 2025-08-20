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
        borderRadius: { xs: '8px', sm: '10px' },
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: `
          0 4px 16px ${alpha(theme.palette.common.black, 0.08)}, 
          0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          display: 'none'
        },
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: `
            0 6px 24px ${alpha(theme.palette.common.black, 0.1)}, 
            0 2px 4px ${alpha(theme.palette.common.black, 0.05)}`,
          border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
        }
      }}
    >
      <CardHeader
        title={`About ${displayName}`}
        titleTypographyProps={{
          variant: 'h6',
          fontWeight: 600,
          fontSize: { xs: '0.75rem', sm: '0.85rem' }
        }}
        action={
          <Stack direction="row" spacing={0.5}>
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
          px: { xs: 1, sm: 1.5 },
          py: 1
        }}
      />
      
      {!showEditor && description && (
        <Box sx={{ px: { xs: 1, sm: 1.5 }, py: 1 }}>
          <Collapse in={expanded} collapsedSize={80}>
            <Box 
              sx={{ 
                position: 'relative',
                ...(!expanded && {
                  overflow: 'hidden'
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
                        color: 'text.primary',
                        lineHeight: 1.5,
                        mb: 0.75,
                        fontSize: '0.75rem'
                      }}
                    >
                      {children}
                    </Typography>
                  ),
                  h1: ({ children }) => (
                    <Typography variant="h6" gutterBottom sx={{ mt: 1, fontWeight: 600, fontSize: '0.9rem' }}>
                      {children}
                    </Typography>
                  ),
                  h2: ({ children }) => (
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 600, fontSize: '0.8rem' }}>
                      {children}
                    </Typography>
                  ),
                  h3: ({ children }) => (
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 0.75, fontWeight: 600, fontSize: '0.75rem' }}>
                      {children}
                    </Typography>
                  ),
                  ul: ({ children }) => (
                    <Box component="ul" sx={{ pl: 1.5, mb: 0.75 }}>
                      {children}
                    </Box>
                  ),
                  ol: ({ children }) => (
                    <Box component="ol" sx={{ pl: 1.5, mb: 0.75 }}>
                      {children}
                    </Box>
                  ),
                  li: ({ children }) => (
                    <Typography 
                      component="li" 
                      variant="body2"
                      sx={{ 
                        color: 'text.primary',
                        mb: 0.25,
                        lineHeight: 1.5,
                        fontSize: '0.75rem'
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