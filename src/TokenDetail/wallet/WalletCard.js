// Material
import { withStyles } from '@mui/styles';
import {
    alpha, styled, useTheme,
    Avatar,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Link,
    Stack,
    Typography,
    Table,
    TableRow,
    TableBody,
    TableCell
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";

// Iconify
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import listCheck from '@iconify/icons-ci/list-check';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// ----------------------------------------------------------------------
const StackStyle = styled(Stack)(({ theme }) => ({
    //boxShadow: theme.customShadows.z0,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    //backgroundColor: alpha(theme.palette.background.default, 0.0),
    borderRadius: '13px',
    padding: '0em 0.5em 1.5em 0.5em',
    backgroundColor: alpha("#919EAB", 0.03),
}));

const Label = withStyles({
    root: {
        color: alpha('#637381', 0.99)
    }
})(Typography);

const badge24hStyle = {
    display: 'inline-block',
    marginLeft: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    backgroundColor: '#323546',
    borderRadius: '4px',
    padding: '2px 4px'
};
// ----------------------------------------------------------------------

export default function WalletCard({name, link, imgUrl}) {


    // return (
    //     <StackStyle>
    //         <CardHeader title={`Price Statistics`}  subheader='' sx={{p:2}}/>
    //     </StackStyle>
    // );

    return (
        <Card variant="outlined" sx={{p:3}}>
                <Stack spacing={1} alignItems='center'>
                    <img
                        alt={'wallet'}
                        src={imgUrl}
                        style={{ height: 56 }}
                    />
                    <Typography variant="wallet_name">{name}</Typography>
                    <Link
                        underline="none"
                        color="inherit"
                        target="_blank"
                        href={`${link}`}
                        rel="noreferrer noopener nofollow"
                    >
                        <Stack direction='row' alignItems='center' spacing={1} color="text.secondary">
                            <Typography sx={{ fontSize: 14 }} >{link}</Typography>
                            <Icon icon={linkExternal} width="16" height="16"/>
                        </Stack>

                        <Stack alignItems='center' sx={{mt:3}}>
                            <Button size="small">Visit Website</Button>
                        </Stack>
                    </Link>
                    
                </Stack>
                
        </Card>
    );
}
