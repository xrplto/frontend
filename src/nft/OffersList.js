import axios from 'axios';
import { useState, useEffect } from 'react';
import { FadeLoader } from 'react-spinners';
import Decimal from 'decimal.js';

// Material
import {
    useTheme,
    Backdrop,
    Divider,
    IconButton,
    Link,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';

// Loader
import { PuffLoader, PulseLoader } from "react-spinners";
import { ProgressBar, Discuss } from 'react-loader-spinner';

// Utils
// import { checkExpiration, getUnixTimeEpochFromRippleEpoch } from 'src/utils/parse';
import { checkExpiration } from 'src/utils/extra';
import { formatDateTime } from 'src/utils/formatTime';
import { normalizeAmount } from 'src/utils/normalizers';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import CountdownTimer from './CountDownTimer';
import QRDialog from 'src/components/QRDialog';
import ConfirmAcceptOfferDialog from './ConfirmAcceptOfferDialog';

export default function OffersList({ nft, offers, handleAcceptOffer, handleCancelOffer, isSell }) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpnft.com/api';
    const { accountProfile, openSnackbar, sync, setSync } = useContext(AppContext);
    const accountLogin = accountProfile?.account;
    const accountToken = accountProfile?.token;

    const isOwner = accountLogin === nft.account;

    const [loading, setLoading] = useState(false);

    return (
        <>
            {offers && offers.length === 0 &&
                <Stack alignItems="center" sx={{mt: 1, mb: 1}}>
                    <Typography variant="s7">No Offers yet</Typography>
                </Stack>
            }

            <Stack mt={1}>
                {
                    offers.map((offer, idx) => {
                        const price = normalizeAmount(offer.amount);
                        let priceAmount = price.amount;
                        if (priceAmount < 1) {
                        } else {
                            priceAmount = new Decimal(price.amount).toDP(2, Decimal.ROUND_DOWN).toNumber();
                        }

                        const expired = checkExpiration(offer.expiration);

                        // let expired = false;
                        // if (offer.expiration) {
                        //     const now = Date.now();
                        //     const expire = (offer.expiration > 946684800 ? offer.expiration: offer.expiration + 946684800) * 1000;

                        //     if (expire < now)
                        //         expired = true;
                        // }

                        return (
                            <Stack key={offer.nft_offer_index} sx={{mt: 0}}>
                                {idx > 0 &&
                                    <Divider sx={{mt:2, mb:2}} />
                                }
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Stack spacing={1}>
                                        <Typography>
                                            <Typography variant='s6' color='#33C2FF' noWrap>{priceAmount} {price.name}&nbsp;&nbsp;</Typography>
                                            <Link
                                                // color="inherit"
                                              //  target="_blank"
                                                href={`https://xrpnft.com/account/${offer.owner}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <Typography variant='s6' style={{ wordBreak: "break-all" }}> {offer.owner}</Typography>
                                            </Link>
                                        </Typography>

                                        {offer.destination &&
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {/* <Typography variant='s4'>Destination</Typography> */}
                                                <TransferWithinAStationIcon />
                                                <Typography variant='s6'>{offer.destination}</Typography>
                                            </Stack>
                                        }

                                        {offer.expiration &&
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant='s7'>{expired?'Expired':'Expires'} on {formatDateTime(offer.expiration * 1000)}</Typography>
                                            </Stack>
                                        }

                                        {/* {offer.expiration ?
                                            <Stack direction="row" alignItems="center">
                                                <Typography variant='s4'>Expires by {new Date(getUnixTimeEpochFromRippleEpoch(offer.expiration)).toLocaleString()}</Typography>
                                                <CountdownTimer targetDate={getUnixTimeEpochFromRippleEpoch(offer.expiration)} />
                                            </Stack>
                                            :
                                            <Stack direction="row" alignItems="center">
                                                <Typography variant='s16'>No Expiration</Typography>
                                            </Stack>
                                        } */}
                                    </Stack>
                                    <Stack>
                                        {/* Sell Offer List - Not Owner */}
                                        {isSell && !isOwner &&
                                            <>
                                                {accountLogin === offer.owner ?
                                                    <Tooltip title="Cancel Offer">
                                                        <IconButton
                                                            aria-label='close'
                                                            onClick={() => handleCancelOffer(offer)}
                                                        >
                                                            <HighlightOffIcon fontSize='medium' color='error' />
                                                        </IconButton>
                                                    </Tooltip>
                                                    :
                                                    <>
                                                        {nft.account === offer.owner ?
                                                            <>
                                                                {offer.destination && accountLogin !== offer.destination ?
                                                                    <>
                                                                        <Tooltip title="This is not transferred to you, you can not accept.">
                                                                            <IconButton aria-label='close'>
                                                                                <CheckCircleOutlineIcon fontSize='medium' color='disabled' />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </>
                                                                    :
                                                                    <Tooltip title="Accept Offer">
                                                                        <IconButton
                                                                            aria-label='close'
                                                                            onClick={() => handleAcceptOffer(offer)}
                                                                        >
                                                                            <CheckCircleOutlineIcon fontSize='medium' color='success' />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                }
                                                            </>
                                                            :
                                                            <Tooltip title="This is not offered from the NFT owner.">
                                                                <IconButton aria-label='close'>
                                                                    <CheckCircleOutlineIcon fontSize='medium' color='disabled' />
                                                                </IconButton>
                                                            </Tooltip>
                                                        }
                                                    </>
                                                }
                                            </>
                                        }

                                        {/* Sell Offer List - Owner */}
                                        {isSell && isOwner &&
                                            <>
                                                {accountLogin === offer.owner ?
                                                    <Tooltip title="Cancel Offer">
                                                        <IconButton
                                                            aria-label='close'
                                                            onClick={() => handleCancelOffer(offer)}
                                                        >
                                                            <HighlightOffIcon fontSize='medium' color='error' />
                                                        </IconButton>
                                                    </Tooltip>
                                                    :
                                                    <Tooltip title="Only the owner of this offer can cancel.">
                                                        <IconButton aria-label='close'>
                                                            <HighlightOffIcon fontSize='medium' color='disabled' />
                                                        </IconButton>
                                                    </Tooltip>
                                                }
                                            </>
                                        }

                                        {/* Buy Offer List - Owner */}
                                        {!isSell && isOwner &&
                                            <>
                                                {accountLogin !== offer.owner ?
                                                    <Tooltip title="Accept Offer">
                                                        <IconButton
                                                            aria-label='close'
                                                            onClick={() => handleAcceptOffer(offer)}
                                                        >
                                                            <CheckCircleOutlineIcon fontSize='medium' color='success' />
                                                        </IconButton>
                                                    </Tooltip>
                                                    :
                                                    <Tooltip title="Cancel Offer">
                                                        <IconButton
                                                            aria-label='close'
                                                            onClick={() => handleCancelOffer(offer)}
                                                        >
                                                            <HighlightOffIcon fontSize='medium' color='error' />
                                                        </IconButton>
                                                    </Tooltip>
                                                }
                                            </>
                                        }

                                        {/* Buy Offer List - Not Owner */}
                                        {!isSell && !isOwner &&
                                            <>
                                                {accountLogin === offer.owner ?
                                                    <Tooltip title="Cancel Offer">
                                                        <IconButton
                                                            aria-label='close'
                                                            onClick={() => handleCancelOffer(offer)}
                                                        >
                                                            <HighlightOffIcon fontSize='medium' color='error' />
                                                        </IconButton>
                                                    </Tooltip>
                                                    :
                                                    <>
                                                    {/* <Tooltip title="Only the owner of this offer can cancel.">
                                                        <IconButton aria-label='close'>
                                                            <HighlightOffIcon fontSize='medium' color='disabled' />
                                                        </IconButton>
                                                    </Tooltip> */}
                                                    </>
                                                }
                                            </>
                                        }
                                    </Stack>
                                </Stack>
                            </Stack>
                        )
                    })
                }
            </Stack>
        </>
    );
}
