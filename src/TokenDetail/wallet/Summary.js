import Decimal from 'decimal.js';
import { useState } from 'react';
// Material
import { withStyles } from '@mui/styles';
import {
    alpha,
    Grid,
    Link,
    Stack,
    Typography
} from '@mui/material';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Components
import WalletCard from './WalletCard';

// CBCCD2
const ContentTypography = withStyles({
    root: {
        color: alpha('#919EAB', 0.99)
    }
})(Typography);

function Rate(num, exch) {
    if (num === 0 || exch === 0)
        return 0;
    return fNumber(num / exch);
}

export default function Summary() {
    const [showContent, setShowContent] = useState(false);
    return (
        <Stack sx={{pt:2, pl:2.5}}>
            <Typography variant='wallet_h3'>Wallets</Typography>
            <Stack direction="row" sx={{mt:1, mb:6}}>
                <ContentTypography variant='subtitle1'>We show you the wallet provider options so you can make an informed choice where to safely store your XRPL tokens/currencies.</ContentTypography>
                <Link
                    component="button"
                    underline="always"
                    variant="body2"
                    color="#637381"
                    onClick={() => {
                        setShowContent(!showContent);
                    }}
                >
                    <ContentTypography variant='subtitle1' sx={{ml:1}}>{showContent?'Read Less':'Read More'}</ContentTypography>
                </Link>
            </Stack>

            <div
                style={{
                    display: showContent?"flex":"none",
                    flexDirection: "column",
                }}
            >
                <Typography variant='wallet_h2'>What Are XRP Ledger Wallets?</Typography>
                <Typography variant='p1'>XRPL <Link href="/status/coming-soon">wallets</Link> are software programs that store private and public keys and interface with the XRP Ledger to enable users to send and receive XRPL currencies and monitor their balance. It is the equivalent of a bank account where you can view, deposit and withdraw funds.</Typography>
                <Typography variant='p1'>XRPL wallets store private and public keys and facilitate the sending and receiving of digital currency and monitor all transactions to protect from identity theft. The private key is used to authorize payments, while the public key is used to access received funds.</Typography>
                <Typography variant='p1'>XRPL wallets can be hot, meaning that they are connected to the internet, or cold, meaning that they have no internet connection. When deciding whether to use a <Link href="/status/coming-soon">hot wallet vs a cold wallet</Link>, you need to consider several factors: while hot wallets are often more user friendly, they also carry a higher risk of loss of funds due to their internet connection.</Typography>

                <Typography variant='wallet_h2'>What Are the Main Types of XRPL Wallets?</Typography>

                <Typography variant='wallet_h2'><Link href="https://bithomp.com/paperwallet/">Paper Wallets</Link></Typography>
                <Typography variant='p1'>XRPL paper wallets are a secure way to hold your cryptocurrencies. Think of them like a savings account with no withdrawal limits. A paper wallet contains both the public and private key for your wallet. The wallet can be used to receive currencies from other people. It is also possible to send currency to this address if it is generated with a genuine random number generator (RNG).</Typography>
                <Typography variant='p1'>They are simple, secure and offline alternatives to digital cryptocurrency wallets. They have all of the benefits of paper money while also providing the unique ability to securely cold-store digital currency without any possibility of a hacker or malware gaining access to your funds.</Typography>

                <Typography variant='wallet_h2'><Link href="https://gatehub.net/">Hot Wallets</Link></Typography>
                <Typography variant='p1'>Currency hot wallets are also known as web wallets or online wallets.These types of wallets are used to make small, frequent payments while requiring the least amount of effort from the individual and/or organization.</Typography>
                <Typography variant='p1'>Currency hot wallets are a digital wallet used to store cryptocurrency funds. A hot wallet is an online system and can be accessed from anywhere as it does not require any physical access to the unit. For example, <Link href="https://www.bitrue.com/">Bitrue</Link> is a popular exchange platform for buying cryptocurrency in the U.S. and Europe, but they also have a web-based digital wallet which allows users to store <Link href="https://coinmarketcap.com/currencies/xrp/">XRP</Link>, <Link href="https://xrpl.to/token/casinocoin-csc">Casino Coin</Link> and <Link href="https://xrpl.to/token/xpunks-xpunk">XPunks</Link>, among other XRPL tokens.</Typography>
                <Typography variant='p1'><Link href="https://gatehub.net/">Gatehub</Link> is another popular hot wallet.</Typography>

                <Typography variant='wallet_h2'><Link href="https://xumm.app/">Cold Wallets</Link></Typography>
                <Typography variant='p1'>Cold wallets refer to any method of storing cryptocurrency which keeps the private keys of your coins offline, preventing any form of hacking, stealing, or unauthorized access. Paper wallets and other cold wallets are considered to be more secure as compared to hot storage solutions.</Typography>


                <Typography variant='wallet_h2'>How to Use a XRP Wallet</Typography>
                <Typography variant='p1'>THE XRP CLUB has a guide that teaches you <Link href="https://www.youtube.com/watch?v=kTm47-TpgsY">how to use a XRP wallet here</Link>.</Typography>

                <Typography variant='para'></Typography>

                <Typography variant='wallet_h2' sx={{mb:5}}>
                    <Link
                        component="button"
                        underline="always"
                        variant="body2"
                        color="#637381"
                        onClick={() => {
                            setShowContent(!showContent);
                        }}
                    >
                        Read Less
                    </Link>
                </Typography>
            </div>

            <Grid container spacing={3} sx={{p:0}}>
                <Grid item xs={12} md={6} lg={4} sx={{pl:0}}>
                    <WalletCard name='XUMM' link='https://xumm.app/' imgUrl='/static/xumm.jpg'/>
                </Grid>
                <Grid item xs={12} md={6} lg={4} sx={{pl:0}}>
                    <WalletCard name='GemWallet' link='https://gemwallet.app/' imgUrl='/static/gemwallet.jpg'/>
                </Grid>
                <Grid item xs={12} md={6} lg={4} sx={{pl:0}}>
                    <WalletCard name='CROSSMARK' link='https://www.crossmark.io/' imgUrl='/static/crossmark.jpg'/>
                </Grid>
                <Grid item xs={12} md={6} lg={4} sx={{pl:0}}>
                    <WalletCard name='SOLO' link='https://www.sologenic.com/ecosystem/solo-wallet' imgUrl='/static/solo.jpg'/>
                </Grid>
                <Grid item xs={12} md={6} lg={4} sx={{pl:0}}>
                    <WalletCard name='Bithomp Paper' link='https://bithomp.com/paperwallet/' imgUrl='/static/bithomp.png'/>
                </Grid>
                <Grid item xs={12} md={6} lg={4} sx={{pl:0}}>
                    <WalletCard name='LEDGER' link='https://www.ledger.com/' imgUrl='/static/ledger.svg'/>
                </Grid>
                <Grid item xs={12} md={6} lg={4} sx={{pl:0}}>
                    <WalletCard name="D'CENT" link='https://dcentwallet.com/' imgUrl='/static/dcent.jpg'/>
                </Grid>
                <Grid item xs={12} md={6} lg={4} sx={{pl:0}}>
                    <WalletCard name="COBO" link='https://cobo.com/' imgUrl='/static/cobo.png'/>
                </Grid>
            </Grid>
        </Stack>
    )
}
