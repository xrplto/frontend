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

export default function HowWeWork({data}) {
    const [showContent, setShowContent] = useState(false);
    return (
        <Stack sx={{pt:2}}>
            <Stack direction="row" sx={{mt:1, mb:6}}>
                <ContentTypography variant='subtitle1'>Find out how we work click here.</ContentTypography>
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
                <Typography variant='wallet_h2'>Today’s XRPL Token Prices, Charts and Data</Typography>
                <Typography variant='para_content'>Welcome to XRPL.to</Typography>
                <Typography variant='para_content'>This site was founded in Nov 2021 by <Link href="https://nftlabs.to">NFT Labs</Link> to provide up-to-date token prices, charts and data, specifically for the emerging XRPL DEX markets. We take our data very seriously, which is collected directly from the XRP Ledger. We stand for accurate, timely, and unbiased information.</Typography>

                <Typography variant='wallet_h2'>XRP Ledger Market Data – All in One Place</Typography>
                <Typography variant='para_content'>Here at XRPL.to, we work hard to ensure that all the relevant and <Link href="/status/coming-soon">up-to-date information</Link> about XRPL Tokens, currencies, and tokens can be located in one easily discoverable place. From the first day the goal was for the site to be the number one location online for XRP Ledger market data. We work hard to empower our users with our unbiased and accurate information.</Typography>

                <Typography variant='wallet_h2'>We Provide Live and Historic Token Charts for Free</Typography>
                <Typography variant='para_content'>Each of our token data pages has a graph that shows both the current and historical price information for the currency or token. Typically, the graph starts at the launch of the asset, but it is possible to select specific dates (to and from) to customize the chart to your own needs. These charts and their information are free to visitors of our website.</Typography>

                <Typography variant='wallet_h2'>How Do We Calculate Our Token Prices?</Typography>
                <Typography variant='para_content'>We receive updated token prices directly from the XRPL DEX based on their pairs. We display prices in real time with no delay. A full explanation can be found <Link href="/status/coming-soon">here</Link>.</Typography>
                <Typography variant='para_content'>Related Links</Typography>
                <Typography variant='para_content'>New to XRP? <Link href="https://uphold.com/en-us/assets/crypto/buy-xrp">Learn how to buy XRP today</Link>.</Typography>
                <Typography variant='para_content'>Ready to learn more? Visit our <Link href="/status/coming-soon">XRPL glossary</Link> and <Link href="/status/coming-soon">Learning hub</Link>.</Typography>
                <Typography variant='para_content'>Want to look up a transaction? Visit <Link href="https://xrpscan.com/">XRPScan</Link> Ledger Explorer.</Typography>

                <Typography variant='wallet_h2'>How Do We Calculate Our Token Valuations?</Typography>
                <Typography variant='para_content'>We calculate our valuations based on the total circulating supply of an asset multiplied by the currency reference price. The topic is explained in more detail <Link href="/status/coming-soon">here</Link>.</Typography>
                
                <Typography variant='wallet_h2'>How Do We Calculate the Total Token Market Cap?</Typography>
                <Typography variant='para_content'>We calculate the total token market capitalization as the sum of all tokens listed on the site.</Typography>

                <Typography variant='wallet_h2'>Does XRPL.to List All Tokens?</Typography>
                <Typography variant='para_content'>Yes, all XRP Ledger tokens are listed automatically. As a company and team, we are very aware that not all tokens and projects have good intentions. While we cannot guarantee the legitimacy of any project, we do our best to display useful information so users can do their own research and decide for themselves.</Typography>

                <Typography variant='wallet_h2'>How Big Is the Global Token Market?</Typography>
                <Typography variant='para_content'>At the time of writing, there are around 7,724 tokens, currencies, and projects in the global token market. As mentioned above, XRPL.to is a fully decentralized system, and all XRPL tokens are listed; it's up to the user to do their due diligence.</Typography>

                <Typography variant='wallet_h2'>What Is a Token?</Typography>
                <Typography variant='para_content'>All assets other than XRP can be represented in the XRP Ledger as <strong>tokens</strong>. Standard tokens are tracked in relationships called  <Link href="https://xrpl.org/trust-lines-and-issuing.html">trust lines</Link> between accounts. Any account can issue tokens to other recipients who are willing to hold them but you cannot unilaterally give tokens away to users who don't want them. Tokens can represent any type of value, including "stablecoins" backed by assets that exist outside of the ledger, purely digital tokens created specifically on the XRP Ledger, community credit, and more.</Typography>

                <Typography variant='wallet_h2'>What Is an IDO?</Typography>
                <Typography variant='para_content'>IDO stands for Initial Dex Offering. Many of the smaller projects in the XRPL and a few of the largest ones raised money from retail investors around the world in the crypto equivalent of a crowdfunding campaign. Investors go to the XRPL DEX usually to buy XRPL tokens from the issuer who is selling them for XRP — you receive tokens in return.</Typography>

                <Typography variant='wallet_h2'>What Is a Stablecoin?</Typography>
                <Typography variant='para_content'>A common model for tokens in the XRP Ledger is that an issuer holds assets of equivalent value outside of the XRP Ledger and issues tokens representing that value on the ledger. This type of issuer is sometimes called a gateway because currency can move into and out of the XRP Ledger through their service. If the assets that back a token use the same amounts and denomination as the tokens in the ledger, that token can be considered a "stablecoin" because in theory the exchange rate between that token and its off-ledger representation should be stable at 1:1.</Typography>
                <Typography variant='para_content'>A stablecoin issuer should offer deposits and withdrawals to exchange the tokens for the actual currency or asset in the world outside the XRP Ledger.</Typography>
                <Typography variant='para_content'>In practice, the XRP Ledger is a computer system that cannot enforce any rules outside of itself, so stablecoins on the XRP Ledger depend on their issuer's integrity. If you can't count on the stablecoins issuer to redeem your tokens for the real thing on demand, then you shouldn't expect the stablecoin to retain its value. As a user, you should be mindful of who's issuing the tokens: are they reliable, lawful, and solvent? If not, it's probably best not to hold those tokens.</Typography>
                
                <Typography variant='wallet_h2'>What Are In-game Tokens?</Typography>
                <Typography variant='para_content'><Link href="/status/coming-soon">Play-to-earn</Link> (P2E) games, also known as <Link href="/status/coming-soon">GameFi</Link>, have emerged as an extremely popular category in the XRP Ledger space. It combines <Link href="/status/coming-soon">non-fungible tokens</Link> (NFT), in-game crypto tokens, <Link href="/status/coming-soon">decentralized finance</Link> (DeFi) elements, and sometimes even metaverse applications. Players have an opportunity to generate revenue by giving their time (and sometimes capital) and playing these games.</Typography>
                <Typography variant='para_content'>One of the biggest game tokenization projects on the XRPL is <Link href="https://zerpcraft.com">ZerpCraft</Link> — a Minecraft land tokenization project using the XLS-19d NFT standard. Where players can buy blocks of land and build structures. This game has become extremely popular within the XRPL NFT community since projects can custom build NFT galleries and display their XRPL NFTs.</Typography>

                <Typography variant='wallet_h2'>Which Is the Best Token to Invest in?</Typography>
                <Typography variant='para_content'>XRPL.to does not offer financial or investment advice about which token, currency or asset does or does not make a good investment, nor do we offer advice about the timing of purchases or sales. We are strictly a data company.</Typography>
                <Typography variant='para_content'>Please remember that the prices, yields, and values of financial assets change. This means that any capital you may invest is at risk. We recommend seeking the advice of a professional investment advisor for guidance related to your circumstances.</Typography>

                <Typography variant='wallet_h2'>If You Are Investing in XRPL Tokens — XRPL.to Is for You</Typography>
                <Typography variant='para_content'>The data at XRPL.to updates live, which means that it is possible to check in on the value of your investments and assets at any time and from anywhere in the world. We look forward to seeing you regularly!</Typography>
                
                <Typography variant='para_content'></Typography>
                <Typography variant='wallet_h2'></Typography>

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
        </Stack>
    )
}