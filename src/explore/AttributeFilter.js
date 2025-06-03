import { useEffect, useState } from 'react';

// Material
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Components
import { fIntNumber } from 'src/utils/formatNumber';
import { styled, alpha } from '@mui/material/styles';

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  backdropFilter: 'blur(15px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: '12px !important',
  boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.04)}, 0 1px 3px ${alpha(
    theme.palette.primary.main,
    0.02
  )}`,
  marginBottom: '8px !important',
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
    height: '1px',
    background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.4)}, ${alpha(
      theme.palette.success.main,
      0.4
    )})`,
    opacity: 0.6
  },
  '&.Mui-expanded': {
    margin: '0 0 8px 0 !important',
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.06)}, 0 1px 4px ${alpha(
      theme.palette.primary.main,
      0.04
    )}`,
    transform: 'translateY(-1px)'
  },
  '&:hover': {
    boxShadow: `0 3px 12px ${alpha(theme.palette.common.black, 0.05)}, 0 1px 3px ${alpha(
      theme.palette.primary.main,
      0.03
    )}`,
    transform: 'translateY(-0.5px)'
  }
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.6
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderRadius: '12px 12px 0 0',
  padding: '8px 12px',
  minHeight: '48px !important',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(
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
  padding: '12px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(
    theme.palette.background.paper,
    0.5
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`
}));

const AttributeItem = styled(Box)(({ theme, checked }) => ({
  padding: '8px 12px',
  borderRadius: '8px',
  background: checked
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
        theme.palette.primary.main,
        0.04
      )} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(
        theme.palette.background.paper,
        0.3
      )} 100%)`,
  border: `1px solid ${
    checked ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.divider, 0.06)
  }`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  marginBottom: '6px',
  cursor: 'pointer',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(
      theme.palette.background.paper,
      0.7
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
    transform: 'translateX(2px)',
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.08)}`
  }
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 4,
  borderRadius: 4,
  backgroundColor: alpha(theme.palette.divider, 0.08),
  marginTop: '4px',
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    boxShadow: `0 1px 2px ${alpha(theme.palette.primary.main, 0.2)}`
  }
}));

const CountChip = styled(Box)(({ theme }) => ({
  padding: '2px 8px',
  borderRadius: '8px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(
    theme.palette.success.main,
    0.06
  )} 100%)`,
  border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
  color: theme.palette.success.main,
  fontWeight: 600,
  fontSize: '0.65rem',
  minWidth: '24px',
  textAlign: 'center',
  boxShadow: `0 1px 4px ${alpha(theme.palette.success.main, 0.1)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: `0 2px 6px ${alpha(theme.palette.success.main, 0.15)}`
  }
}));

export default function AttributeFilter({ attrs, setFilterAttrs }) {
  const [attrFilter, setAttrFilter] = useState([]);

  useEffect(() => {
    const tempAttrs = [];
    for (const attr of attrs) {
      tempAttrs.push({
        trait_type: attr.title,
        value: []
      });
    }
    setAttrFilter(tempAttrs);
  }, [attrs]);

  const handleAttrChange = (title, key) => {
    const tempAttrs = [...attrFilter];
    const found = tempAttrs.find((elem) => elem.trait_type === title);

    if (found) {
      if (found.value.includes(key)) {
        let values = [...found.value];
        values.splice(found.value.indexOf(key), 1);
        found.value = values;
      } else {
        found.value.push(key);
      }

      setAttrFilter(tempAttrs);
      setFilterAttrs(tempAttrs);
    }
  };

  // Calculate total selected filters
  const totalSelected = attrFilter.reduce((sum, attr) => sum + attr.value.length, 0);

  return (
    <Box>
      {/* Header with selection count */}
      {totalSelected > 0 && (
        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
            label={`${totalSelected} filter${totalSelected > 1 ? 's' : ''} selected`}
            size="small"
            sx={{
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: '24px',
              boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
              '&:hover': {
                transform: 'translateY(-0.5px)',
                boxShadow: (theme) => `0 3px 10px ${alpha(theme.palette.primary.main, 0.3)}`
              }
            }}
          />
        </Box>
      )}

      <Stack spacing={1}>
        {attrs.map((attr, idx) => {
          const title = attr.title;
          const items = attr.items;
          const count = Object.keys(items).length;
          const selectedCount =
            attrFilter.find((elem) => elem.trait_type === title)?.value?.length || 0;
          const maxValue = Math.max(...Object.values(items).map((item) => item.count || item));

          return (
            <StyledAccordion key={title} defaultExpanded={idx === 0}>
              <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  width="100%"
                  pr={0.5}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        p: 0.5,
                        borderRadius: '6px',
                        background: (theme) =>
                          `linear-gradient(135deg, ${alpha(
                            theme.palette.info.main,
                            0.12
                          )} 0%, ${alpha(theme.palette.info.main, 0.06)} 100%)`,
                        border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CategoryIcon
                        sx={{
                          color: 'info.main',
                          fontSize: '0.9rem'
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: 'text.primary',
                          fontSize: '0.85rem',
                          lineHeight: 1.2
                        }}
                      >
                        {title}
                      </Typography>
                      {selectedCount > 0 && (
                        <Typography
                          variant="caption"
                          color="primary.main"
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.65rem'
                          }}
                        >
                          {selectedCount} selected
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                  <Tooltip title={`${count} options available`} placement="top" arrow>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.25,
                        borderRadius: '12px',
                        background: (theme) =>
                          `linear-gradient(135deg, ${alpha(
                            theme.palette.warning.main,
                            0.12
                          )} 0%, ${alpha(theme.palette.warning.main, 0.06)} 100%)`,
                        border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                        color: 'warning.main',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        minWidth: '24px',
                        textAlign: 'center',
                        boxShadow: (theme) => `0 1px 4px ${alpha(theme.palette.warning.main, 0.1)}`
                      }}
                    >
                      {count}
                    </Box>
                  </Tooltip>
                </Stack>
              </StyledAccordionSummary>
              <StyledAccordionDetails>
                <Stack spacing={0.5}>
                  {Object.keys(items).map((key) => {
                    const data = items[key];
                    const itemCount = data.count || data;
                    const isChecked =
                      attrFilter.find((elem) => elem.trait_type === title)?.value?.includes(key) ===
                      true;
                    const percentage = (itemCount / maxValue) * 100;

                    return (
                      <AttributeItem
                        key={title + key}
                        checked={isChecked}
                        onClick={() => handleAttrChange(title, key)}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Checkbox
                            checked={isChecked ?? false}
                            onChange={() => handleAttrChange(title, key)}
                            color="primary"
                            size="small"
                            sx={{
                              '& .MuiSvgIcon-root': {
                                fontSize: '1rem'
                              }
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              sx={{ mb: 0.25 }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  color: 'text.primary',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {key}
                              </Typography>
                              <CountChip>{fIntNumber(itemCount)}</CountChip>
                            </Stack>
                            <Box sx={{ position: 'relative' }}>
                              <StyledLinearProgress variant="determinate" value={percentage} />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  position: 'absolute',
                                  right: 0,
                                  top: -14,
                                  fontSize: '0.6rem',
                                  fontWeight: 400
                                }}
                              >
                                {percentage.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </AttributeItem>
                    );
                  })}
                </Stack>
              </StyledAccordionDetails>
            </StyledAccordion>
          );
        })}
      </Stack>
    </Box>
  );
}
