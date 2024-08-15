import { normalizeCurrencyCodeXummImpl } from "src/utils/normalizers";
import { useContext, useState } from "react";
import {
    styled, useTheme,
    Box,
    CardMedia,
    Chip,
    Link,
    Stack,
    Tooltip,
    Typography,
    Skeleton,
    Card,
    Grid,
    CardContent,
    Button
} from '@mui/material';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { Icon } from '@iconify/react';

import { getMinterName } from "src/utils/constants";
import { fNumber, fIntNumber } from 'src/utils/formatNumber';
import { getNftCoverUrl } from 'src/utils/parse/utils';
import Label from './Label';
import { AppContext } from "src/AppContext";

const CardWrapper = styled(Card)(({ theme }) => ({
    borderRadius: 10,
    backdropFilter: 'blur(50px)',
    cursor: 'pointer',
    transition: 'border-color 0.3s', // removed transform from transition
    overflow: 'hidden',
    paddingBottom: 5,
    border: `2px solid transparent`, // default border
    '&:hover': {
        borderColor: theme.palette.primary.main, // change border color on hover
    },
}));

export default function NFTCard({ nft, handleRemove }) {
    const theme = useTheme();
    const { accountProfile } = useContext(AppContext);
    const isAdmin = accountProfile?.admin;

    const [colors, setColors] = useState([]);
    const [loadingImg, setLoadingImg] = useState(true);

    const {
        uuid,
        account,
        cost,
        costb,
        meta,
        NFTokenID,
        destination,
        rarity_rank,
        updateEvent,
    } = nft;

    const isSold = false;
    const imgUrl = getNftCoverUrl(nft, 'small');
    const name = nft.meta?.name || meta?.Name || 'No Name';

    const getColors = colors => {
        setColors(c => [...c, ...colors]);
    };

    const onImageLoaded = () => {
        setLoadingImg(false);
    };

    const handleRemoveNft = (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
        handleRemove(NFTokenID);
    };

    return (
        <Link href={`/nft/{NFTokenID}`} underline='none' sx={{ position: 'relative' }}>
            <CardWrapper sx={{ margin: 'auto', maxWidth: 280, aspectRatio: '9 / 15' }}>
                {isAdmin && (
                    <CloseIcon
                        sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1500 }}
                        onClick={(e) => handleRemoveNft(e)}
                    />
                )}
                {isSold && (
                    <Label
                        variant="filled"
                        color="error"
                        sx={{ zIndex: 9, top: 24, right: 24, position: 'absolute', textTransform: 'uppercase' }}
                    >
                        SOLD
                    </Label>
                )}
                <CardMedia
                    component={loadingImg ? Skeleton : 'img'}
                    image={imgUrl}
                    loading={loadingImg.toString()}
                    alt={'NFT' + uuid}
                    sx={{ width: '100%', height: '76.1%', maxHeight: 240, objectFit: 'cover' }}
                />
                <img src={imgUrl} style={{ display: 'none' }} onLoad={onImageLoaded} />

                {/* Offer and Minimalist Event Display on top right corner */}
                <Stack direction="column" alignItems="flex-end" justifyContent="flex-start" sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1500 }}>
                    {costb && costb.amount && (
                        <Box sx={{ backgroundColor: theme.palette.primary.main, borderRadius: '8px', padding: '4px 8px', marginBottom: '8px', boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#fff', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }} noWrap>
                                Offer ✕ {fNumber(costb.amount)}
                            </Typography>
                        </Box>
                    )}
                    {updateEvent && (
                        <Box sx={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: '8px', padding: '2px 6px', boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#fff' }} noWrap>
                                {updateEvent}
                            </Typography>
                        </Box>
                    )}
                </Stack>

                <CardContent sx={{ padding: 1, pb: 0.5 }}>
                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                        <Typography variant="h6" noWrap sx={{ mt: 0.5, mb: 0.4, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {name}
                        </Typography>
                    </Box>
                    {destination && getMinterName(account) ? (
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0 }}>
                            <Tooltip title="Sold & Transfer">
                                <SportsScoreIcon />
                            </Tooltip>
                            {rarity_rank > 0 && (
                                <Chip
                                    variant="outlined"
                                    icon={<LeaderboardOutlinedIcon sx={{ width: 11 }} />}
                                    label={<Typography variant="caption">{fIntNumber(rarity_rank)}</Typography>}
                                    sx={{ height: 18 }}
                                />
                            )}
                        </Stack>
                    ) : (
                        <Grid container alignItems="center" spacing={0.1}>
                            <Grid item xs={12}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0 }}>
                                    {cost && (
                                        cost.currency === "XRP" ? (
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <Typography>✕</Typography>
                                                <Typography variant="body2" noWrap>{fNumber(cost.amount)}</Typography>
                                            </Stack>
                                        ) : (
                                            <Typography variant="body2" noWrap>
                                                {fNumber(cost.amount)} {normalizeCurrencyCodeXummImpl(cost.currency)}
                                            </Typography>
                                        )
                                    )}
                                    {rarity_rank > 0 && (
                                        <Chip
                                            variant="outlined"
                                            icon={<LeaderboardOutlinedIcon sx={{ width: 11 }} />}
                                            label={<Typography variant="caption">{fIntNumber(rarity_rank)}</Typography>}
                                            sx={{ height: 18 }}
                                        />
                                    )}
                                </Stack>
                            </Grid>
                        </Grid>
                    )}
                    {/* Buy Now button below Event */}
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        fullWidth
                        sx={{ mt: 1, boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)', borderRadius: '8px', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
                    >
                        Buy Now
                    </Button>
                </CardContent>
            </CardWrapper>
        </Link>
    );
}
