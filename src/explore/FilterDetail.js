import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  Typography,
  Box,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';
import { styled, alpha } from '@mui/material/styles';

// Styled components
const StyledAccordion = styled(Accordion)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
    theme.palette.background.paper,
    0.8
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: '16px !important',
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
    theme.palette.primary.main,
    0.04
  )}`,
  marginBottom: '12px !important',
  overflow: 'hidden',
  position: 'relative',
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
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
    opacity: 0.8
  },
  '&.Mui-expanded': {
    margin: '0 0 12px 0 !important',
    boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.1)}, 0 4px 12px ${alpha(
      theme.palette.primary.main,
      0.08
    )}`
  }
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  borderRadius: '16px 16px 0 0',
  padding: '16px 20px',
  minHeight: '64px !important',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
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
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.6
  )} 100%)`,
  backdropFilter: 'blur(10px)'
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  margin: '8px 0',
  padding: '12px 16px',
  borderRadius: '12px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(
    theme.palette.background.paper,
    0.3
  )} 100%)`,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
      theme.palette.background.paper,
      0.8
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    transform: 'translateX(4px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
  },
  '& .MuiFormControlLabel-label': {
    width: '100%'
  }
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(
    theme.palette.primary.main,
    0.08
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  color: theme.palette.primary.main,
  fontWeight: 600,
  fontSize: '0.75rem',
  height: '24px',
  '& .MuiChip-label': {
    padding: '0 8px'
  }
}));

const FilterContainer = styled(Box)(({ theme }) => ({
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

// Components
import AttributeFilter from './AttributeFilter';

export default function FilterDetail({
  collection,
  filter,
  setFilter,
  subFilter,
  setSubFilter,
  setFilterAttrs,
  setPage // reset the page when applying a filter
}) {
  const type = collection?.type;
  const extra = collection?.extra;
  const attrs = collection?.attrs || [];

  const handleFlagChange = (e) => {
    const value = e.target.value;
    let newFilter = filter ^ value;
    if (value === '4') {
      // 16 8 4 2 1
      //  0 0 1 1 1
      newFilter &= 0x07;
    } else if (value === '8') {
      // 16 8 4 2 1
      //  0 1 0 1 1
      newFilter &= 0x0b;
    } else if (value === '16') {
      // 16 8 4 2 1
      //  1 0 0 1 1
      newFilter &= 0x13;
    }
    setFilter(newFilter);
    setPage(0);
  };

  const handleOnSaleFlagChange = (event) => {
    const value = event.target.value;
    setSubFilter(value);
    setPage(0);
  };

  return (
    <FilterContainer>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            color: 'text.primary',
            fontWeight: 700,
            fontSize: '1.2rem',
            letterSpacing: '-0.02em',
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(
                theme.palette.primary.main,
                0.8
              )} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Filter & Sort
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Refine your search results
        </Typography>
      </Box>

      <Stack spacing={2}>
        <StyledAccordion defaultExpanded>
          <StyledAccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: '10px',
                  background: (theme) =>
                    `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 100%)`,
                  border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FactCheckIcon
                  sx={{
                    color: 'primary.main',
                    fontSize: '1.2rem'
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                Status
              </Typography>
            </Stack>
          </StyledAccordionSummary>
          <StyledAccordionDetails>
            <Stack spacing={3}>
              {type === 'bulk' && (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    background: (theme) =>
                      `linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
                      border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: (theme) =>
                        `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(
                          theme.palette.primary.main,
                          0.5
                        )})`,
                      opacity: 0.7
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: (theme) =>
                          `linear-gradient(135deg, ${alpha(
                            theme.palette.primary.main,
                            0.15
                          )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        boxShadow: (theme) =>
                          `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                      }}
                    >
                      <Checkbox
                        checked={(filter & 1) !== 0}
                        onChange={handleFlagChange}
                        value={1}
                        color="primary"
                        sx={{
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.5rem'
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            fontSize: '1.1rem'
                          }}
                        >
                          Buy with Mints
                        </Typography>
                        <Box
                          sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: '20px',
                            background: (theme) =>
                              `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            boxShadow: (theme) =>
                              `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                            minWidth: '40px',
                            textAlign: 'center'
                          }}
                        >
                          {extra?.buyWithMints || 0}
                        </Box>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Available for bulk minting purchases
                        </Typography>
                        <Tooltip
                          title="Disabled on Spinning collections, only enabled on Bulk collections."
                          placement="top"
                          arrow
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: (theme) => alpha(theme.palette.info.main, 0.1),
                              color: 'info.main',
                              cursor: 'help',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background: (theme) => alpha(theme.palette.info.main, 0.2),
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <Icon icon={infoFilled} style={{ fontSize: '12px' }} />
                          </Box>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              )}

              {type !== 'normal' && (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    background: (theme) =>
                      `linear-gradient(135deg, ${alpha(
                        theme.palette.success.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                    border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => `0 8px 25px ${alpha(theme.palette.success.main, 0.15)}`,
                      border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: (theme) =>
                        `linear-gradient(90deg, ${theme.palette.success.main}, ${alpha(
                          theme.palette.success.main,
                          0.5
                        )})`,
                      opacity: 0.7
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: (theme) =>
                          `linear-gradient(135deg, ${alpha(
                            theme.palette.success.main,
                            0.15
                          )} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`,
                        border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        boxShadow: (theme) =>
                          `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`
                      }}
                    >
                      <Checkbox
                        checked={(filter & 2) !== 0}
                        onChange={handleFlagChange}
                        value={2}
                        color="success"
                        sx={{
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.5rem'
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            fontSize: '1.1rem'
                          }}
                        >
                          Recently Minted
                        </Typography>
                        <Box
                          sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: '20px',
                            background: (theme) =>
                              `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            boxShadow: (theme) =>
                              `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                            minWidth: '40px',
                            textAlign: 'center'
                          }}
                        >
                          {extra?.boughtWithMints || 0}
                        </Box>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Fresh NFTs pending transfer or acceptance
                        </Typography>
                        <Tooltip
                          title="Display recently Minted NFTs and being transferred to users. Or NFTs that pending to be accepted by users."
                          placement="top"
                          arrow
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: (theme) => alpha(theme.palette.info.main, 0.1),
                              color: 'info.main',
                              cursor: 'help',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background: (theme) => alpha(theme.palette.info.main, 0.2),
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <Icon icon={infoFilled} style={{ fontSize: '12px' }} />
                          </Box>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              )}

              <Box
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  background: (theme) =>
                    `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(
                      theme.palette.warning.main,
                      0.03
                    )} 100%)`,
                  border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.12)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) => `0 8px 25px ${alpha(theme.palette.warning.main, 0.15)}`,
                    border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: (theme) =>
                      `linear-gradient(90deg, ${theme.palette.warning.main}, ${alpha(
                        theme.palette.warning.main,
                        0.5
                      )})`,
                    opacity: 0.7
                  }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(
                          theme.palette.warning.main,
                          0.15
                        )} 0%, ${alpha(theme.palette.warning.main, 0.08)} 100%)`,
                      border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.warning.main, 0.15)}`
                    }}
                  >
                    <Checkbox
                      checked={(filter & 4) !== 0}
                      onChange={handleFlagChange}
                      value={4}
                      color="warning"
                      sx={{
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.5rem'
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: 'text.primary',
                          fontSize: '1.1rem'
                        }}
                      >
                        Buy Now
                      </Typography>
                      <Box
                        sx={{
                          px: 2,
                          py: 0.5,
                          borderRadius: '20px',
                          background: (theme) =>
                            `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          boxShadow: (theme) =>
                            `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`,
                          minWidth: '40px',
                          textAlign: 'center'
                        }}
                      >
                        {extra?.onSaleCount || 0}
                      </Box>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      NFTs available for immediate purchase
                    </Typography>
                  </Box>
                </Stack>

                {(filter & 0x04) !== 0 && (
                  <Box
                    sx={{
                      mt: 3,
                      p: 3,
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.9
                        )} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: '12px',
                      boxShadow: (theme) =>
                        `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.05)}`
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'warning.main'
                        }}
                      />
                      Sort Options
                    </Typography>
                    <RadioGroup
                      aria-labelledby="on-sale-sub-filter"
                      name="on-sale-sub-filter"
                      value={subFilter}
                      onChange={handleOnSaleFlagChange}
                    >
                      <Stack spacing={1}>
                        {[
                          {
                            value: 'pricenoxrp',
                            label: 'Price No XRP',
                            desc: 'Exclude XRP pricing'
                          },
                          {
                            value: 'pricexrpasc',
                            label: 'Price Low to High',
                            desc: 'Lowest prices first'
                          },
                          {
                            value: 'pricexrpdesc',
                            label: 'Price High to Low',
                            desc: 'Highest prices first'
                          }
                        ].map((option) => (
                          <Box
                            key={option.value}
                            sx={{
                              p: 2,
                              borderRadius: '10px',
                              background: (theme) =>
                                subFilter === option.value
                                  ? `linear-gradient(135deg, ${alpha(
                                      theme.palette.warning.main,
                                      0.1
                                    )} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`
                                  : `linear-gradient(135deg, ${alpha(
                                      theme.palette.background.paper,
                                      0.6
                                    )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                              border: (theme) =>
                                `1px solid ${
                                  subFilter === option.value
                                    ? alpha(theme.palette.warning.main, 0.2)
                                    : alpha(theme.palette.divider, 0.08)
                                }`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background: (theme) =>
                                  `linear-gradient(135deg, ${alpha(
                                    theme.palette.warning.main,
                                    0.08
                                  )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                                border: (theme) =>
                                  `1px solid ${alpha(theme.palette.warning.main, 0.15)}`
                              }
                            }}
                          >
                            <FormControlLabel
                              value={option.value}
                              control={<Radio color="warning" size="small" sx={{ mr: 1 }} />}
                              label={
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      color: 'text.primary'
                                    }}
                                  >
                                    {option.label}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: '0.75rem' }}
                                  >
                                    {option.desc}
                                  </Typography>
                                </Box>
                              }
                              sx={{
                                margin: 0,
                                width: '100%',
                                '& .MuiFormControlLabel-label': {
                                  width: '100%'
                                }
                              }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </RadioGroup>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  background: (theme) =>
                    `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(
                      theme.palette.info.main,
                      0.03
                    )} 100%)`,
                  border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) => `0 8px 25px ${alpha(theme.palette.info.main, 0.15)}`,
                    border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: (theme) =>
                      `linear-gradient(90deg, ${theme.palette.info.main}, ${alpha(
                        theme.palette.info.main,
                        0.5
                      )})`,
                    opacity: 0.7
                  }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(
                          theme.palette.info.main,
                          0.15
                        )} 0%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
                      border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`
                    }}
                  >
                    <Checkbox
                      checked={(filter & 16) !== 0}
                      onChange={handleFlagChange}
                      value={16}
                      color="info"
                      sx={{
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.5rem'
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: 'text.primary',
                          fontSize: '1.1rem'
                        }}
                      >
                        Rarity Sorting
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Sort NFTs by their rarity ranking
                      </Typography>
                      <Tooltip title="Sort NFTs with rarity" placement="top" arrow>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: (theme) => alpha(theme.palette.info.main, 0.1),
                            color: 'info.main',
                            cursor: 'help',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              background: (theme) => alpha(theme.palette.info.main, 0.2),
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <Icon icon={infoFilled} style={{ fontSize: '12px' }} />
                        </Box>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </StyledAccordionDetails>
        </StyledAccordion>

        <StyledAccordion defaultExpanded>
          <StyledAccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2bh-content"
            id="panel2bh-header2"
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: '10px',
                  background: (theme) =>
                    `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(
                      theme.palette.success.main,
                      0.08
                    )} 100%)`,
                  border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BookmarkAddedIcon
                  sx={{
                    color: 'success.main',
                    fontSize: '1.2rem'
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: 'success.main',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                Attributes
              </Typography>
            </Stack>
          </StyledAccordionSummary>
          <StyledAccordionDetails>
            {!attrs || attrs.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  p: 4,
                  borderRadius: '12px',
                  background: (theme) =>
                    `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.6
                    )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                  border: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  No Attributes Available
                </Typography>
              </Box>
            ) : (
              <AttributeFilter setFilterAttrs={setFilterAttrs} attrs={attrs} />
            )}
          </StyledAccordionDetails>
        </StyledAccordion>
      </Stack>
    </FilterContainer>
  );
}
