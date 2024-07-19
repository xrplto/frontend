// Material
import {
    styled,
    IconButton,
    Link,
    Stack,
    TableCell,
    TableRow,
    Tooltip,
    Typography,
    useTheme,
    useMediaQuery
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';

// Utils
import { formatMonthYearDate } from 'src/utils/formatTime';
import { fNumber, fIntNumber, fVolume } from 'src/utils/formatNumber';

// Iconify
import { Icon } from '@iconify/react';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

// Components

const IconCover = styled('div')(
    ({ theme }) => `
        width: 30px;  // reduced from 40px
        height: 30px; // reduced from 40px
        box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;

        border: 1px solid ${theme.colors.alpha.black[50]};
        border-radius: 10px;
        box-shadow: rgb(0 0 0 / 8%) 0px 5px 10px;
        background-color: ${theme.colors.alpha.white[70]};
        position: relative;
        overflow: hidden;
        transition: width 1s ease-in-out, height .5s ease-in-out !important;
        -webkit-tap-highlight-color: transparent;
        &:hover, &.Mui-focusVisible {
            z-index: 1;
            & .MuiImageBackdrop-root {
                opacity: 0.1;
            }
            & .MuiIconEditButton-root {
                opacity: 1;
            }
        }

        ${theme.breakpoints.down('sm')} {
            width: 20px; // reduced from 28px
            height: 20px; // reduced from 28px
        }
    `
);

const IconWrapper = styled('div')(
    ({ theme }) => `
        box-sizing: border-box;
        display: inline-block;
        position: relative;
        width: 28px;  // reduced from 38px
        height: 28px; // reduced from 38px

        ${theme.breakpoints.down('sm')} {
            width: 18px; // reduced from 26px
            height: 18px; // reduced from 26px
        }
  `
);

const IconImage = styled('img')(
    ({ theme }) => `
    position: absolute;
    inset: 0px;
    box-sizing: border-box;
    padding: 0px;
    border: none;
    margin: auto;
    display: block;
    width: 0px; height: 0px;
    min-width: 100%;
    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
    object-fit: cover;
    border-radius: 0px;
  `
);

const ImageBackdrop = styled('span')(({ theme }) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.palette.common.black,
    opacity: 0,
    transition: theme.transitions.create('opacity')
}));

export default function Row({ id, item, isMine }) {
    const {
        uuid,
        account,
        accountName,
        name,
        slug,
        items,
        type,
        description,
        logoImage,
        featuredImage,
        bannerImage,
        costs,
        extra,
        minter,
        verified,
        created,
        volume,
        totalVolume,
        floor,
        owners,
        vol24h
    } = item;

    const floorPrice = floor?.amount || 0;
    let volume1 = fVolume(volume || 0);
    let volume2 = fVolume(totalVolume || 0);

    const strDateTime = formatMonthYearDate(created);

    // const featuredImageUrl = `https://s1.xrpnft.com/collection/${featuredImage}`;
    const logoImageUrl = `https://s1.xrpnft.com/collection/${logoImage}`;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleRowClick = () => {
        // history.push(`/collection/${slug}`);
        // onclick="document.location = 'links.html';"
        document.location = `/collection/${slug}`;
    };

    return (
        <TableRow
            hover
            key={uuid}
            onClick={handleRowClick}
            style={{ cursor: 'pointer' }}
        >
            <TableCell align="left" sx={{ p: 0, border: 'none' }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ pt: 1, pb: 1 }}
                >
                    <Typography
                        variant={isMobile ? 'caption' : 'body2'} 
                        sx={{ /*width: isMobile ? '12px' : '16px'*/ }}
                    >
                        {id}
                    </Typography>
                    <Link
                        href={
                            isMine
                                ? `/collection/${slug}/edit`
                                : `/collection/${slug}`
                        }
                        underline="none"
                    >
                        <IconCover>
                            <IconWrapper>
                                <IconImage src={logoImageUrl} />
                            </IconWrapper>

                            {isMine ? (
                                <IconButton
                                    className="MuiIconEditButton-root"
                                    aria-label="edit"
                                    sx={{
                                        position: 'absolute',
                                        left: '0vw',
                                        top: '0vh',
                                        opacity: 0,
                                        zIndex: 1,
                                        width: { xs: '18px', sm: '28px' },  // reduced sizes
                                        height: { xs: '18px', sm: '28px' }  // reduced sizes
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                            ) : (
                                <ImageBackdrop className="MuiImageBackdrop-root" />
                            )}
                        </IconCover>
                    </Link>

                    <Link underline="none" href={`/collection/${slug}`}>
                        <Stack spacing={0.4}>
                            <Stack direction="row" spacing={0.5} sx={{ pt: 0 }}>
                            <Typography
    variant={isMobile ? 'caption' : 'token'} 
    noWrap
    color="primary" // Assign primary color
    sx={{
        width: isMobile ? '80px' : undefined,
        textOverflow: isMobile ? 'ellipsis' : 'none'
    }}
>
    {name}
</Typography>

                              
                            </Stack>
                            <Typography
                                variant={isMobile ? 'caption' : 'token'} 
                                noWrap
                            >
                          
                            </Typography>
                        </Stack>
                    </Link>
                </Stack>
            </TableCell>

            <TableCell align="right" sx={{ pl: 0, pr: 0, border: 'none' }}>
                <Typography variant={isMobile ? 'caption' : 'body2'} noWrap> 
                    <Icon
                        icon={rippleSolid}
                        width={isMobile ? 10 : 12} 
                        height={isMobile ? 10 : 12} 
                    />{' '}
                    {fNumber(vol24h)}
                </Typography>
            </TableCell>

            <TableCell align="right" sx={{ pl: 0, pr: 0, border: 'none' }}>
                <Typography variant={isMobile ? 'caption' : 'body2'} noWrap> 
                    <Icon
                        icon={rippleSolid}
                        width={isMobile ? 10 : 12} 
                        height={isMobile ? 10 : 12} 
                    />{' '}
                    {fNumber(floorPrice)}
                </Typography>
            </TableCell>

            {/* <TableCell align="right" sx={{pl:0, pr:0}}>
                <Typography variant="body2" noWrap><Icon icon={rippleSolid} width={16} height={16} /> {volume1}</Typography>
            </TableCell> */}

            <TableCell
                align="right"
                sx={{
                    pl: 0,
                    pr: 0,
                    border: 'none',
                    display: { xs: 'none', sm: 'table-cell' }
                }}
            >
                <Typography variant={isMobile ? 'caption' : 'body2'} noWrap> 
                    <Icon icon={rippleSolid} width={12} height={12} /> {volume2} 
                </Typography>
            </TableCell>

            <TableCell
                align="right"
                sx={{
                    pl: 0,
                    pr: 0,
                    border: 'none',
                    display: { xs: 'none', sm: 'table-cell' }
                }}
            >
                <Typography variant={isMobile ? 'caption' : 'body2'} noWrap> 
                    {fIntNumber(owners || 0)}
                </Typography>
            </TableCell>

            <TableCell
                align="right"
                sx={{
                    pl: 0,
                    pr: 0,
                    border: 'none',
                    display: { xs: 'none', sm: 'table-cell' }
                }}
            >
                <Typography variant={isMobile ? 'caption' : 'body2'} noWrap> 
                    {fIntNumber(items)}
                </Typography>
            </TableCell>
        </TableRow>
    );
}
