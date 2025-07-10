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
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(20px)',
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