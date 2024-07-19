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
    Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';

// Iconify
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';

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
        <>
            <Stack sx={{ pr: 0 }}>
                <Accordion defaultExpanded>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel2bh-content"
                        id="panel2bh-header"
                    >
                        <Stack spacing={2} direction="row">
                            <FactCheckIcon />
                            <Typography variant="s3">Status</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                        <FormGroup sx={{ flexDirection: 'col' }}>
                            {type === 'bulk' && (
                                <FormControlLabel
                                    label={
                                        <Stack direction="row" spacing={0.5}>
                                            <Typography variant="s3">
                                                Buy with Mints{' '}
                                                <Typography variant="s7">
                                                    ({extra?.buyWithMints})
                                                </Typography>
                                            </Typography>
                                            <Tooltip title="Disabled on Spinning collections, only enabled on Bulk collections.">
                                                <Icon icon={infoFilled} />
                                            </Tooltip>
                                        </Stack>
                                    }
                                    value={1}
                                    control={
                                        <Checkbox
                                            checked={(filter & 1) !== 0}
                                            onChange={handleFlagChange}
                                        />
                                    }
                                />
                            )}
                            {type !== 'normal' && (
                                <FormControlLabel
                                    label={
                                        <Stack direction="row" spacing={0.5}>
                                            <Typography variant="s3">
                                                Recently Minted{' '}
                                                <Typography variant="s7">
                                                    ({extra?.boughtWithMints})
                                                </Typography>
                                            </Typography>
                                            <Tooltip title="Display recently Minted NFTs and being transferred to users. Or NFTs that pending to be accepted by users.">
                                                <Icon icon={infoFilled} />
                                            </Tooltip>
                                        </Stack>
                                    }
                                    value={2}
                                    control={
                                        <Checkbox
                                            checked={(filter & 2) !== 0}
                                            onChange={handleFlagChange}
                                        />
                                    }
                                />
                            )}
                            <FormControlLabel
                                label={
                                    <Typography variant="s3">
                                        Buy Now{' '}
                                        <Typography variant="s7">
                                            ({extra?.onSaleCount})
                                        </Typography>
                                    </Typography>
                                }
                                value={4}
                                control={
                                    <Checkbox
                                        checked={(filter & 4) !== 0}
                                        onChange={handleFlagChange}
                                    />
                                }
                            />

                            {(filter & 0x04) !== 0 && (
                                <FormControl sx={{ ml: 5, mt: 2 }}>
                                    <RadioGroup
                                        aria-labelledby="on-sale-sub-filter"
                                        name="on-sale-sub-filter"
                                        value={subFilter}
                                        onChange={handleOnSaleFlagChange}
                                    >
                                        <FormControlLabel
                                            value="pricenoxrp"
                                            control={<Radio />}
                                            label="Price No XRP"
                                        />
                                        <FormControlLabel
                                            value="pricexrpasc"
                                            control={<Radio />}
                                            label="Price Low"
                                        />
                                        <FormControlLabel
                                            value="pricexrpdesc"
                                            control={<Radio />}
                                            label="Price High"
                                        />
                                    </RadioGroup>
                                </FormControl>
                            )}


                            <FormControlLabel
                                label={
                                    <Stack direction="row" spacing={0.5}>
                                        <Typography variant="s3">
                                            Rarity
                                        </Typography>
                                        <Tooltip title="Sort NFTs with rarity">
                                            <Icon icon={infoFilled} />
                                        </Tooltip>
                                    </Stack>
                                }
                                value={16}
                                control={
                                    <Checkbox
                                        checked={(filter & 16) !== 0}
                                        onChange={handleFlagChange}
                                    />
                                }
                            />
                        </FormGroup>
                    </AccordionDetails>
                </Accordion>
            </Stack>
            <Stack sx={{ pr: 0, mt: 1 }}>
                <Accordion defaultExpanded style={{ margin: 0 }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel2bh-content"
                        id="panel2bh-header2"
                    >
                        <Stack spacing={2} direction="row">
                            <BookmarkAddedIcon />
                            <Typography variant="s3">Attributes</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails style={{ padding: 0 }}>
                        {!attrs || attrs.length === 0 ? (
                            <Stack alignItems="center">
                                <Typography variant="s7" mt={2} mb={2}>
                                    No Attributes
                                </Typography>
                            </Stack>
                        ) : (
                            <AttributeFilter
                                setFilterAttrs={setFilterAttrs}
                                attrs={attrs}
                            />
                        )}
                    </AccordionDetails>
                </Accordion>
            </Stack>
        </>
    );
}
