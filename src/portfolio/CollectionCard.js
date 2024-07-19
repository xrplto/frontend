import { normalizeCurrencyCodeXummImpl } from "src/utils/normalizers";
import { useContext, useState } from "react";

// Material
import {
    styled, useTheme,
    Box,
    CardMedia,
    Chip,
    Stack,
    Tooltip,
    Typography,
    Skeleton,
    Card,
    Grid,
    CardContent
} from '@mui/material';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import CloseIcon from '@mui/icons-material/Close';

// Iconify
import { Icon } from '@iconify/react';


// Utils
import { getMinterName } from "src/utils/constants";
import { fNumber, fIntNumber } from 'src/utils/formatNumber';

// Components
import Label from './Label';
import { AppContext } from "src/AppContext";
import { useRouter } from "next/router";

const CardWrapper = styled(Card)(
    ({ theme }) => `
        border-radius: 10px;
        backdrop-filter: blur(50px);
        padding: 0px;
        cursor: pointer;
        transition: width 1s ease-in-out, height .5s ease-in-out !important;
        -webkit-tap-highlight-color: transparent;
        overflow: hidden;
        padding-bottom: 5px;
  `
);

export default function CollectionCard({ collectionData, type, account, handleRemove }) {
    const theme = useTheme();
    const router = useRouter();
    const { accountProfile } = useContext(AppContext);
    const isAdmin = accountProfile?.admin;

    const [loadingImg, setLoadingImg] = useState(true);
    const [colors, setColors] = useState([]);

    const collection = collectionData.collection;
    if (!collection) return null;

    const {
        id: uuid,
        cost,
        costb,
        meta,
        dfile,
        NFTokenID,
        destination,
        rarity,
        rarity_rank
    } = collection;

    const isSold = false;
    const imgUrl = `https://s1.xrpnft.com/collection/${collection.logoImage}`;
    const isVideo = false;

    const name = collection.name || 'No Name';

    const getColors = colors => {
        setColors(c => [...c, ...colors]);
    }

    const onImageLoaded = () => {
        setLoadingImg(false);
    }

    const handleRemoveNft = (e) => {
        e.preventDefault();

        if (!isAdmin) return;

        if (!confirm(`Are you sure you want to remove "${name}"?`)) {
            return;
        }

        handleRemove(NFTokenID);
    }

    const collectionType = type.charAt(0).toUpperCase() + type.slice(1);

    const redirectToDetail = () => {
        router.push(`/profile/${account}/collection${collectionType}/${collectionData.collection.id}`);
    }

    return (
        <Stack onClick={redirectToDetail}>
            <CardWrapper
                sx={{
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    width: '100%',
                    maxWidth: 280,
                    aspectRatio: '9 / 15',
                }}
            >
                {isAdmin &&
                    <CloseIcon
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            zIndex: 1500
                        }}
                        onClick={(e) => handleRemoveNft(e)}
                    />
                }
                {isSold && (
                    <Label
                        variant="filled"
                        color={(isSold && 'error') || 'info'}
                        sx={{
                            zIndex: 9,
                            top: 24,
                            right: 24,
                            position: 'absolute',
                            textTransform: 'uppercase'
                        }}
                    >
                        SOLD
                    </Label>
                )}
                <CardMedia
                    component={
                        loadingImg ? () =>
                            <Skeleton
                                variant='rectangular'
                                sx={{
                                    width: '100%',
                                    height: '75%'
                                }}
                            /> :
                            isVideo ? 'video' : 'img'}
                    image={imgUrl}
                    loading={loadingImg.toString()}
                    alt={'NFT' + uuid}
                    sx={{
                        width: '100%',
                        height: '75%',
                        maxWidth: 280,
                        objectFit: 'cover'
                    }}
                />
                <img src={imgUrl}
                    style={{ display: 'none' }}
                    onLoad={onImageLoaded} />
                {
                    isVideo &&
                    <video src={imgUrl}
                        style={{ display: 'none' }}
                        onCanPlay={onImageLoaded}
                    />
                }
                <CardContent
                    sx={{ padding: 0 }}
                >
                    <Box display={'flex'} flexDirection='column' justifyContent={'space-evenly'} px={1}>
                        {name.length > 20 ?
                            <Box display='flex'>
                                <Typography
                                    variant="s15"
                                    textOverflow='ellipsis'
                                    overflow='hidden'
                                    whiteSpace='nowrap'
                                    sx={{ mt: 0.5, mb: 0.4 }}
                                >
                                    {name.slice(0, -5)}
                                </Typography>
                                <Typography
                                    variant="s15"
                                    sx={{ mt: 0.5, mb: 0.4, width: 45 }}
                                >
                                    {name.slice(-5)}
                                </Typography>
                            </Box>
                            :
                            <Typography
                                variant="s15"
                                sx={{ mt: 0.5, mb: 0.4 }}
                            >
                                {name}
                            </Typography>
                        }
                        {destination && getMinterName(account) ? (
                            <Stack direction="row" alignItems='center' justifyContent='space-between' sx={{ mt: 0, pl: 0, pr: 0 }}>
                                <Tooltip title={`Sold & Transfer`}>
                                    <SportsScoreIcon />
                                </Tooltip>

                                {rarity_rank > 0 &&
                                    <Chip
                                        variant="outlined"
                                        icon={<LeaderboardOutlinedIcon sx={{ width: '11px' }} />}
                                        label={<Typography variant="s12">{fIntNumber(rarity_rank)}</Typography>}
                                        sx={{
                                            height: '18px',
                                            pt: 0
                                        }}
                                    />
                                }
                            </Stack>
                        ) : (
                            <Grid container alignItems='center' spacing={0.1}>
                                <Grid item xs={12}>
                                    <Stack direction="row" alignItems='center' justifyContent='space-between' sx={{ mt: 0, pl: 0, pr: 0 }}>
                                        <Typography variant='s7'>{collectionData.nftCount} item(s)</Typography>

                                        {rarity_rank > 0 &&
                                            <Chip
                                                variant="outlined"
                                                icon={<LeaderboardOutlinedIcon sx={{ width: '11px' }} />}
                                                label={<Typography variant="s12">{fIntNumber(rarity_rank)}</Typography>}
                                                sx={{
                                                    height: '18px',
                                                    pt: 0
                                                }}
                                            />
                                        }
                                    </Stack>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant='s7'>{collectionData.nftsForSale} listed</Typography>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                </CardContent>
            </CardWrapper>
        </Stack >
    );
};
