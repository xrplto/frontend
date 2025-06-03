import { useState, useMemo } from 'react';
import { isEqual } from 'lodash';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
  Box,
  Chip,
  Tooltip,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import TuneIcon from '@mui/icons-material/Tune';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { fIntNumber } from 'src/utils/formatNumber';
import { styled, alpha } from '@mui/material/styles';

const StyledContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
    theme.palette.background.paper,
    0.8
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: '20px',
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
    theme.palette.primary.main,
    0.04
  )}`,
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
    opacity: 0.8
  }
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  backdropFilter: 'blur(15px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: '16px !important',
  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}, 0 1px 4px ${alpha(
    theme.palette.primary.main,
    0.03
  )}`,
  marginBottom: '16px !important',
  overflow: 'hidden',
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:before': {
    display: 'none'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.6)}, ${alpha(
      theme.palette.success.main,
      0.6
    )})`,
    opacity: 0.7
  },
  '&.Mui-expanded': {
    margin: '0 0 16px 0 !important',
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}, 0 2px 8px ${alpha(
      theme.palette.primary.main,
      0.06
    )}`,
    transform: 'translateY(-2px)'
  },
  '&:hover': {
    boxShadow: `0 6px 24px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 6px ${alpha(
      theme.palette.primary.main,
      0.04
    )}`,
    transform: 'translateY(-1px)'
  }
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.6
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderRadius: '16px 16px 0 0',
  padding: '16px 20px',
  minHeight: '64px !important',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
      theme.palette.background.paper,
      0.9
    )} 100%)`
  },
  '& .MuiAccordionSummary-content': {
    margin: '0 !important',
    alignItems: 'center'
  },
  '& .MuiAccordionSummary-expandIconWrapper': {
    color: theme.palette.primary.main,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&.Mui-expanded': {
      transform: 'rotate(180deg)'
    }
  }
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: '20px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(
    theme.palette.background.paper,
    0.5
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`
}));

const StyledChip = styled(Chip)(({ theme, variant }) => ({
  background:
    variant === 'active'
      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
          theme.palette.background.paper,
          0.6
        )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${
    variant === 'active'
      ? alpha(theme.palette.primary.main, 0.3)
      : alpha(theme.palette.divider, 0.15)
  }`,
  color: variant === 'active' ? 'white' : theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '0.75rem',
  height: '28px',
  boxShadow:
    variant === 'active'
      ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
      : `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow:
      variant === 'active'
        ? `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
        : `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
  },
  '& .MuiChip-label': {
    padding: '0 12px'
  }
}));

const StyledButton = styled(Button)(({ theme, variant }) => ({
  borderRadius: '12px',
  padding: '8px 20px',
  fontWeight: 600,
  fontSize: '0.875rem',
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow:
    variant === 'contained'
      ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
      : `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
  ...(variant === 'outlined' && {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
      theme.palette.background.paper,
      0.6
    )} 100%)`,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
    color: theme.palette.text.primary
  }),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow:
      variant === 'contained'
        ? `0 6px 16px ${alpha(theme.palette.primary.main, 0.35)}`
        : `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
  }
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme, checked }) => ({
  margin: '8px 0',
  padding: '12px 16px',
  borderRadius: '12px',
  background: checked
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
        theme.palette.primary.main,
        0.03
      )} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(
        theme.palette.background.paper,
        0.3
      )} 100%)`,
  border: `1px solid ${
    checked ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.divider, 0.08)
  }`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(
      theme.palette.background.paper,
      0.8
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    transform: 'translateX(4px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
  },
  '& .MuiFormControlLabel-label': {
    width: '100%'
  }
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 8,
  backgroundColor: alpha(theme.palette.divider, 0.1),
  '& .MuiLinearProgress-bar': {
    borderRadius: 8,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

export default function FilterAttribute({ attrs, filterAttrs, setFilterAttrs }) {
  const [expanded, setExpanded] = useState(false);

  const [fAttrs, setFAttrs] = useState({});

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleAttrChange = (e) => {
    const value = e.target.value;

    if (fAttrs[value]) delete fAttrs[value];
    else fAttrs[value] = true;

    setFAttrs({ ...fAttrs });
  };

  const handleApplyAttrFilter = (e) => {
    setFilterAttrs({ ...fAttrs });
  };

  const handleClearAttrFilter = (e) => {
    setFAttrs({});
    setExpanded(false);
  };

  const activeFiltersCount = useMemo(() => Object.keys(fAttrs).length, [fAttrs]);

  return (
    <StyledContainer>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                background: (theme) =>
                  `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 100%)`,
                border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
              }}
            >
              <TuneIcon
                sx={{
                  color: 'primary.main',
                  fontSize: '1.3rem'
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  fontSize: '1.1rem',
                  letterSpacing: '-0.02em',
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(
                      theme.palette.primary.main,
                      0.8
                    )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Attribute Filters
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500, fontSize: '0.85rem' }}
              >
                Refine by specific traits
              </Typography>
            </Box>
          </Stack>
          <StyledChip
            label={`${activeFiltersCount} active`}
            variant={activeFiltersCount > 0 ? 'active' : 'default'}
            size="small"
            icon={
              activeFiltersCount > 0 ? (
                <CheckCircleIcon sx={{ fontSize: '16px !important' }} />
              ) : undefined
            }
          />
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          {activeFiltersCount > 0 && (
            <StyledButton
              variant="outlined"
              onClick={handleClearAttrFilter}
              size="small"
              startIcon={<FilterListIcon sx={{ fontSize: '16px' }} />}
            >
              Clear All
            </StyledButton>
          )}
          {!isEqual(fAttrs, filterAttrs) && (
            <StyledButton
              variant="contained"
              onClick={handleApplyAttrFilter}
              size="small"
              startIcon={<CheckCircleIcon sx={{ fontSize: '16px' }} />}
            >
              Apply Filters
            </StyledButton>
          )}
        </Stack>
      </Box>

      {/* Attributes List */}
      <Stack spacing={2}>
        {attrs.map((attr, idx) => {
          const itemCount = Object.keys(attr.items).length;
          const maxValue = Math.max(...Object.values(attr.items));
          return (
            <StyledAccordion
              key={attr.title}
              expanded={expanded === 'panel' + idx}
              onChange={handleAccordionChange('panel' + idx)}
            >
              <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  width="100%"
                  pr={1}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        boxShadow: (theme) => `0 0 8px ${alpha(theme.palette.primary.main, 0.4)}`
                      }}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '1rem'
                      }}
                    >
                      {attr.title}
                    </Typography>
                  </Stack>
                  <Tooltip title={`${itemCount} options available`} placement="top" arrow>
                    <Box
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: '16px',
                        background: (theme) =>
                          `linear-gradient(135deg, ${alpha(
                            theme.palette.info.main,
                            0.15
                          )} 0%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
                        border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        color: 'info.main',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        minWidth: '32px',
                        textAlign: 'center',
                        boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.info.main, 0.15)}`
                      }}
                    >
                      {itemCount}
                    </Box>
                  </Tooltip>
                </Stack>
              </StyledAccordionSummary>
              <StyledAccordionDetails>
                <Stack spacing={1}>
                  {Object.entries(attr.items).map(([key, value]) => {
                    const checkValue = `${attr.title}:${key}`;
                    const isChecked = fAttrs[checkValue] === true;
                    const percentage = (value / maxValue) * 100;
                    return (
                      <Box
                        key={checkValue}
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          background: (theme) =>
                            isChecked
                              ? `linear-gradient(135deg, ${alpha(
                                  theme.palette.primary.main,
                                  0.1
                                )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                              : `linear-gradient(135deg, ${alpha(
                                  theme.palette.background.paper,
                                  0.6
                                )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                          border: (theme) =>
                            `1px solid ${
                              isChecked
                                ? alpha(theme.palette.primary.main, 0.2)
                                : alpha(theme.palette.divider, 0.08)
                            }`,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: (theme) =>
                              `linear-gradient(135deg, ${alpha(
                                theme.palette.primary.main,
                                0.08
                              )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                            border: (theme) =>
                              `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                            transform: 'translateX(4px)',
                            boxShadow: (theme) =>
                              `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                          }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Checkbox
                            checked={isChecked}
                            onChange={handleAttrChange}
                            value={checkValue}
                            color="primary"
                            sx={{
                              '& .MuiSvgIcon-root': {
                                fontSize: '1.3rem'
                              }
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              sx={{ mb: 1 }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: 'text.primary',
                                  fontSize: '0.9rem'
                                }}
                              >
                                {key}
                              </Typography>
                              <Box
                                sx={{
                                  px: 1.5,
                                  py: 0.3,
                                  borderRadius: '12px',
                                  background: (theme) =>
                                    `linear-gradient(135deg, ${alpha(
                                      theme.palette.success.main,
                                      0.15
                                    )} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`,
                                  border: (theme) =>
                                    `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                                  color: 'success.main',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  minWidth: '32px',
                                  textAlign: 'center'
                                }}
                              >
                                {fIntNumber(value)}
                              </Box>
                            </Stack>
                            <Box sx={{ position: 'relative' }}>
                              <StyledLinearProgress variant="determinate" value={percentage} />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  position: 'absolute',
                                  right: 0,
                                  top: -20,
                                  fontSize: '0.7rem',
                                  fontWeight: 500
                                }}
                              >
                                {percentage.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </StyledAccordionDetails>
            </StyledAccordion>
          );
        })}
      </Stack>
    </StyledContainer>
  );
}
