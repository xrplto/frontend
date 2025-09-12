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

const MarkdownParagraph = ({ children }) => (
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
);

const MarkdownH1 = ({ children }) => (
  <Typography variant="h6" gutterBottom sx={{ mt: 1, fontWeight: 600, fontSize: '0.9rem' }}>
    {children}
  </Typography>
);

const MarkdownH2 = ({ children }) => (
  <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 600, fontSize: '0.8rem' }}>
    {children}
  </Typography>
);

const MarkdownH3 = ({ children }) => (
  <Typography variant="subtitle2" gutterBottom sx={{ mt: 0.75, fontWeight: 600, fontSize: '0.75rem' }}>
    {children}
  </Typography>
);

const MarkdownUL = ({ children }) => (
  <Box component="ul" sx={{ pl: 1.5, mb: 0.75 }}>
    {children}
  </Box>
);

const MarkdownOL = ({ children }) => (
  <Box component="ol" sx={{ pl: 1.5, mb: 0.75 }}>
    {children}
  </Box>
);

const MarkdownLI = ({ children }) => (
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
);

const markdownComponents = {
  p: MarkdownParagraph,
  h1: MarkdownH1,
  h2: MarkdownH2,
  h3: MarkdownH3,
  ul: MarkdownUL,
  ol: MarkdownOL,
  li: MarkdownLI
};

export default function Description({ 
  token, 
  showEditor, 
  setShowEditor, 
  description, 
  onApplyDescription,
  mdEditor 
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

  if (!description && !showEditor && !isAdmin) return null;

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
        // Sidebar sizing: compact and right-aligned
        // Slightly inset to align with TokenSummary
        width: '100%',
        maxWidth: { md: 'calc(100% - 16px)' },
        ml: { md: 'auto' },
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
      
      {showEditor && mdEditor ? (
        <Box 
          sx={{ 
            px: { xs: 1, sm: 1.5 }, 
            py: 1,
            '& .rc-md-editor': {
              border: 'none !important',
              borderRadius: '0 !important',
              boxShadow: 'none !important',
              '& .rc-md-navigation': {
                backgroundColor: theme.palette.background.paper,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                padding: '8px',
                '& .button-wrap': {
                  '& .button': {
                    color: theme.palette.text.primary,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }
                }
              },
              '& .editor-container': {
                backgroundColor: theme.palette.background.paper,
                '& .sec-md-editor-input': {
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  borderRight: `1px solid ${alpha(theme.palette.divider, 0.15)}`
                },
                '& .sec-html-preview': {
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  padding: '16px'
                },
                '& .input': {
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: '14px',
                  lineHeight: '1.6'
                }
              }
            }
          }}
        >
          {mdEditor}
        </Box>
      ) : !showEditor && description ? (
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
                components={markdownComponents}
              >
                {description}
              </ReactMarkdown>
            </Box>
          </Collapse>
        </Box>
      ) : (
        !showEditor && (
          <Box sx={{ px: { xs: 1, sm: 1.5 }, py: 1, minHeight: 60 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontStyle: 'italic',
                fontSize: '0.75rem'
              }}
            >
              No description available.
            </Typography>
          </Box>
        )
      )}
    </Card>
  );
}
