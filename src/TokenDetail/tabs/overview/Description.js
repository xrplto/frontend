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
      lineHeight: 1.4,
      mb: 0.5,
      fontSize: '0.7rem'
    }}
  >
    {children}
  </Typography>
);

const MarkdownH1 = ({ children }) => (
  <Typography variant="h6" gutterBottom sx={{ mt: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
    {children}
  </Typography>
);

const MarkdownH2 = ({ children }) => (
  <Typography variant="subtitle1" gutterBottom sx={{ mt: 0.5, fontWeight: 500, fontSize: '0.75rem' }}>
    {children}
  </Typography>
);

const MarkdownH3 = ({ children }) => (
  <Typography
    variant="subtitle2"
    gutterBottom
    sx={{ mt: 0.5, fontWeight: 500, fontSize: '0.7rem' }}
  >
    {children}
  </Typography>
);

const MarkdownUL = ({ children }) => (
  <Box component="ul" sx={{ pl: 1.2, mb: 0.5 }}>
    {children}
  </Box>
);

const MarkdownOL = ({ children }) => (
  <Box component="ol" sx={{ pl: 1.2, mb: 0.5 }}>
    {children}
  </Box>
);

const MarkdownLI = ({ children }) => (
  <Typography
    component="li"
    variant="body2"
    sx={{
      color: 'text.primary',
      mb: 0.15,
      lineHeight: 1.4,
      fontSize: '0.7rem'
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
        borderRadius: '12px',
        background: 'transparent',
        border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: 'none',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        mb: 0.75,
        '&:hover': {
          boxShadow: 'none',
          borderColor: alpha(theme.palette.divider, 0.3),
          background: alpha(theme.palette.background.paper, 0.04)
        }
      }}
    >
      <CardHeader
        title={`About ${displayName}`}
        titleTypographyProps={{
          variant: 'h6',
          fontWeight: 500,
          fontSize: '0.75rem'
        }}
        action={
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={expanded ? 'Show less' : 'Show more'}>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                  borderRadius: 1,
                  padding: 0.5
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
                    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    borderRadius: 1,
                    color: showEditor ? 'error.main' : 'inherit',
                    padding: 0.5
                  }}
                >
                  {showEditor ? <CloseIcon /> : <EditIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        }
        sx={{
          borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.1)}`,
          px: 1,
          py: 0.75
        }}
      />

      {showEditor && mdEditor ? (
        <Box
          sx={{
            px: 1,
            py: 0.75,
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
                    borderRadius: '4px'
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
        <Box sx={{ px: 1, py: 0.75 }}>
          <Collapse in={expanded} collapsedSize={60}>
            <Box
              sx={{
                position: 'relative',
                ...(!expanded && {
                  overflow: 'hidden'
                })
              }}
            >
              <ReactMarkdown components={markdownComponents}>{description}</ReactMarkdown>
            </Box>
          </Collapse>
        </Box>
      ) : (
        !showEditor && (
          <Box sx={{ px: 1, py: 0.75, minHeight: 40 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic',
                fontSize: '0.7rem'
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
