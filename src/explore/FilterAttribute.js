import { useState } from 'react';
import { isEqual } from 'lodash';

// Material
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
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

// Utils
import { fIntNumber } from 'src/utils/formatNumber';

export default function FilterAttribute({ attrs, filterAttrs, setFilterAttrs }) {

    const [expanded, setExpanded] = useState(false);

    const [fAttrs, setFAttrs] = useState({});

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const handleAttrChange = (e) => {
        const value = e.target.value;

        if (fAttrs[value])
            delete fAttrs[value];
        else
            fAttrs[value] = true;

        setFAttrs({ ...fAttrs });
    }

    const handleApplyAttrFilter = (e) => {
        setFilterAttrs({ ...fAttrs });
    }

    const handleClearAttrFilter = (e) => {
        setFAttrs({});
        setExpanded(false);
    }


    return (
        <Stack spacing={2} sx={{ mt: 0, pr: 0 }}>

            <Stack direction="row" spacing={1} justifyContent="right" pr={2}>
                {Object.keys(fAttrs).length > 0 &&
                    <Button variant="outlined" onClick={handleClearAttrFilter} size="small">
                        Clear
                    </Button>
                }
                {!isEqual(fAttrs, filterAttrs) &&
                    <Button variant="outlined" onClick={handleApplyAttrFilter} size="small">
                        Apply
                    </Button>
                }
            </Stack>
            {attrs.map((attr, idx) => {
                const title = attr.title;
                const items = attr.items;

                const count = Object.keys(items).length;

                return (
                    <Accordion key={title} expanded={expanded === 'panel' + idx} onChange={handleAccordionChange('panel' + idx)} style={{ margin: 0, boxShadow: 'none' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" width='100%' pr={1}>
                                <Typography variant='s5'>{title}</Typography>
                                <Typography variant='s7'>{count}</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FormGroup sx={{ flexDirection: 'col' }}>
                                {
                                    Object.keys(items).map((key, index) => {
                                        const value = items[key];
                                        const checkValue = title + ":" + key;
                                        const isChecked = fAttrs[checkValue] === true;
                                        return (
                                            <Stack key={title + key} direction="row" justifyContent="space-between" alignItems="center" width='100%' pr={1}>
                                                <FormControlLabel
                                                    label={
                                                        <Typography variant='s4'>{key}</Typography>
                                                    }
                                                    value={checkValue}
                                                    control={<Checkbox checked={isChecked} onChange={handleAttrChange} />}
                                                />
                                                <Typography variant='s7'>{fIntNumber(value)}</Typography>
                                            </Stack>
                                        )
                                    })
                                }
                            </FormGroup>
                        </AccordionDetails>
                    </Accordion>
                )
            })}
        </Stack>
    );
}
