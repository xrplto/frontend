import axios from 'axios'
import { useState, useEffect, useRef } from 'react';
import Decimal from 'decimal.js';
import {MD5} from "crypto-js";

// Material
import { withStyles } from '@mui/styles';
import {
    alpha, styled,
    Avatar,
    Box,
    IconButton,
    Link,
    CardHeader,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Grid
} from '@mui/material';

// Timeline
import DateRangeIcon from '@mui/icons-material/DateRange';
import { makeStyles } from '@mui/styles';
import { FacebookShareButton, TwitterShareButton } from "react-share";
import { FacebookIcon, TwitterIcon } from "react-share";

const generateClassName = (rule, sheet) => {
  // Custom logic to generate class names
  return `my-component-${rule.key}`;
};

const useStyles = makeStyles(() => ({
  customComponent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    margin: '10px 0',
    /*maxWidth: '250px',*/
  },
  lineContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px',
    width: '100%',
  },
  verticalLine: {
    width: '2px',
    height: '15px',
    background: 'grey',
    marginLeft: '11px', // Adjust margin to align with icon
  },
  icon: {
    marginRight: '5px', // Adjust margin to align with vertical line
    fontSize: '1.25rem',
    color: 'grey',
  },
  yearsAgo: {
    marginRight: '10px',
    fontSize: '12px',
    color: 'grey',
  },
  price: {
    marginLeft: 'auto',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  priceToday: {
    fontSize: '17px',
  },
}), { generateClassName }); // Pass the custom class name generator

// Components
import HistoryToolbar from './HistoryToolbar';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import { formatDateTime } from 'src/utils/formatTime';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
// ----------------------------------------------------------------------

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

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + ' ...' : str;
};

function getMD5(issuer, currency) {
    return MD5(issuer  + '_' +  currency).toString();
}

export default function HistoryData({token}) {
    const BASE_URL = 'https://api.xrpl.to/api';

    const { darkMode } = useContext(AppContext);

    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [count, setCount] = useState(0);
    const [hists, setHists] = useState([]);
    
    const {
        issuer,
        currency,
        md5
    } = token;

    useEffect(() => {
        function getHistories() {
            // https://api.xrpl.to/api/history?md5=c9ac9a6c44763c1bd9ccc6e47572fd26&page=0&limit=10
            axios.get(`${BASE_URL}/history?md5=${md5}&page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setCount(ret.count);
                        setHists(ret.hists);
                    }
                }).catch(err => {
                    console.log("Error on getting exchanges!!!", err);
                }).then(function () {
                    // always executed
                });
        }
        getHistories();

    }, [page, rows]);

    const tableRef = useRef(null);
    const [scrollLeft, setScrollLeft] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollLeft(tableRef?.current?.scrollLeft > 0);
        };

        tableRef?.current?.addEventListener('scroll', handleScroll);

        return () => {
            tableRef?.current?.removeEventListener('scroll', handleScroll);
        };
        
    }, []);
    
    // Timeline 

	const {
		name,
	 } = token;

	let user = token.user;
	if (!user) user = name;
	const imgUrl = `https://s1.xrpl.to/token/${md5}`;
      
	function getClosestEntry(date, entries, startIndex = 0) {
		let closestEntry = entries[startIndex];
		let minDiff = Math.abs(date - closestEntry[0]);

		for (let i = startIndex; i < entries.length; i++) {
			const entry = entries[i];
			const diff = Math.abs(date - entry[0]);

			if (diff > minDiff) {
				break;
			}

			minDiff = diff;
			closestEntry = entry;
		}

		//console.log('Closest', date, new Date(date).toLocaleDateString("en-US"), new Date(closestEntry[0]).toLocaleDateString("en-US"), startIndex)

		closestEntry[2] = startIndex; // Store the startIndex in the third element
		return closestEntry;
	}
 
    const [histsPrices, setHistsPrices] = useState([]);
    
    useEffect(() => {
            axios.get(`${BASE_URL}/graph/${md5}?range=ALL`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
						const currentDate = new Date();
						const history = ret.history.reverse(); 
						const yearlyValues = [token.usd];
						let startIndex = 0;

						for (let yearsAgo = 1; ; yearsAgo++) {
							const targetDate = new Date(currentDate.getFullYear() - yearsAgo, currentDate.getMonth(), currentDate.getDate());
							const closestEntry = getClosestEntry(targetDate.getTime(), history, startIndex);

							if (closestEntry[0] === history[history.length - 1][0]) {
								// Break if we are on the last element
								// But still check if it's within 10 days to include to output
								const daysDifference = Math.abs(targetDate - new Date(closestEntry[0])) / (1000 * 60 * 60 * 24);
								if (daysDifference <= 10) {
									yearlyValues.push(closestEntry[1]);
									break;
								}
								// If the closest entry is the last one in the dataset, stop
								break;
							}

							yearlyValues.push(closestEntry[1]);

							// Update startIndex based on the last iteration
							startIndex = closestEntry[2];
						}
						//console.log(yearlyValues);
						setHistsPrices(yearlyValues);

                    }
                }).catch(err => {
                    console.log("Error on getting graph ALL!!!", err);
                }).then(function () {
                    // always executed
                });        
    }, []);    

	const classes = useStyles();
	
	// From Share.js
    const title = `${user} price today: ${name} to USD conversion, live rates, trading volume, historical data, and interactive chart`;
    const desc = `Access up-to-date ${user} prices, ${name} market cap, trading pairs, interactive charts, and comprehensive data from the leading XRP Ledger token price-tracking platform.`;
    const url = typeof window !== 'undefined' && window.location.href ? window.location.href : '';//webxtor SEO fix

    return (
        <>

		<Grid container spacing={3} sx={{p:0}}>
			<Grid item xs={12} md={9.5} lg={9.5} sx={{ order: { xs: 2, lg: 1 } }}>
			
            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    py: 1,
                    overflow: "auto",
                    width: "100%",
                    "& > *": {
                        scrollSnapAlign: "center",
                    },
                    "::-webkit-scrollbar": { display: "none" },
                }}
                ref={tableRef}
            >
                <Table stickyHeader sx={{
                    "& .MuiTableCell-root": {
                        borderBottom: "none",
                        boxShadow: darkMode
                            ? "inset 0 -1px 0 rgba(68 67 67), inset 0 -1px 0 rgba(255, 255, 255, 0.1)"
                            : "inset 0 -1px 0 #dadee3",
                    }
                }}>
                    <TableHead>
                        <TableRow>
                            <TableCell align="left" sx={{
                                position: "sticky",
                                //zIndex: 1001,
                                left: 0,
                                background: darkMode ? "#17171A" : '#F2F5F9'
                            }}>#</TableCell>
                            <TableCell align="left" sx={{
                                position: "sticky",
                                //zIndex: 1002,
                                left: hists.length > 0 ? 48 : 40,
                                background: darkMode ? "#17171A" : '#F2F5F9',
                                '&:before': (scrollLeft ? {
                                    content: "''",
                                    boxShadow: "inset 10px 0 8px -8px #00000026",
                                    position: "absolute",
                                    top: "0",
                                    right: "0",
                                    bottom: "-1px",
                                    width: "30px",
                                    transform: "translate(100%)",
                                    transition: "box-shadow .3s",
                                    pointerEvents: "none",
                                } : {})
                            }}>Time</TableCell>
                            <TableCell align="left">Price</TableCell>
                            <TableCell align="left">Taker Paid</TableCell>
                            <TableCell align="left">Taker Got</TableCell>
                            <TableCell align="left">Taker</TableCell>
                            <TableCell align="left">Maker</TableCell>
                            <TableCell align="left">Ledger</TableCell>
                            <TableCell align="left">Hash</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        // {
                        //     "_id": "23304962_1",
                        //     "dir": "buy",
                        //     "account": "rHmaZbZGqKWN7D45ue7J5cRu8yxyNdHeN2",
                        //     "paid": {
                        //         "issuer": "XRPL",
                        //         "currency": "XRP",
                        //         "name": "XRP",
                        //         "value": "179999.9982"
                        //     },
                        //     "got": {
                        //         "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                        //         "currency": "USD",
                        //         "name": "USD",
                        //         "value": "1096.755823946603"
                        //     },
                        //     "pair": "21e8e9b61d766f6187cb9009fda56e9e",
                        //     "hash": "98229608E154559663CBA8A78AF42AF7E803B40E5814CFABC639CA238A9E8DFE",
                        //     "ledger": 23304962,
                        //     "time": 1471034710000
                        // },
                        hists.map((row, idx) => {

                                const {
                                    _id,
                                    maker,
                                    taker,
                                    seq,
                                    paid,
                                    got,
                                    ledger,
                                    hash,
                                    time
                                } = row;

                                
                                const paidName = normalizeCurrencyCodeXummImpl(paid.currency);
                                const gotName = normalizeCurrencyCodeXummImpl(got.currency);
                                const md51 = getMD5(paid.issuer, paid.currency);
                                // const md52 = getMD5(got.issuer, got.currency);
                                
                                let exch;
                                let name;

                                if (md5 === md51) {
                                    // volume = got.value;
                                    exch = Decimal.div(got.value, paid.value).toNumber();
                                    name = gotName;
                                } else {
                                    // volume = paid.value;
                                    exch = Decimal.div(paid.value, got.value).toNumber();
                                    name = paidName;
                                }

                                const strDateTime = formatDateTime(time);

                                return (
                                    <TableRow
                                        key={_id}
                                        sx={{
                                            "&:hover": {
                                                "& .MuiTableCell-root": {
                                                    backgroundColor: darkMode ? "#232326 !important" : "#D9DCE0 !important"
                                                }
                                            }
                                        }}
                                    >
                                        <TableCell align="left" style={{
                                            position: "sticky",
                                            //zIndex: 1001,
                                            left: 0,
                                            background: darkMode ? "#17171A" : '#F2F5F9'
                                        }}>
                                            <Typography variant="subtitle2">{idx + page * rows + 1}</Typography>
                                        </TableCell>
                                        <TableCell align="left" sx={{
                                            position: "sticky",
                                            //zIndex: 1002,
                                            left: 48,
                                            background: darkMode ? "#17171A" : '#F2F5F9',
                                            '&:before': (scrollLeft ? {
                                                content: "''",
                                                boxShadow: "inset 10px 0 8px -8px #00000026",
                                                position: "absolute",
                                                top: "0",
                                                right: "0",
                                                bottom: "-1px",
                                                width: "30px",
                                                transform: "translate(100%)",
                                                transition: "box-shadow .3s",
                                                pointerEvents: "none",
                                            } : {})
                                        }}>
                                            <Typography variant="caption">{strDateTime}</Typography>
                                        </TableCell>
                                        <TableCell align="left"><Typography variant="caption">{fNumber(exch)} {name}</Typography></TableCell>
                                        <TableCell align="left">
                                            {fNumber(paid.value)} <Typography variant="caption">{paidName}</Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            {fNumber(got.value)} <Typography variant="caption">{gotName}</Typography>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Link
                                                // underline="none"
                                                // color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${taker}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                {truncate(taker, 12)}
                                            </Link>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Link
                                                // underline="none"
                                                // color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${maker}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                {truncate(maker, 12)}
                                            </Link>
                                        </TableCell>
                                        <TableCell align="left">{ledger}</TableCell>
                                        <TableCell align="left"sx={{
												width: '5%', //Timeline
												whiteSpace: 'nowrap'
										}}>
                                            <Stack direction="row" alignItems='center'>
                                                <Link
                                                    // underline="none"
                                                    // color="inherit"
                                                    target="_blank"
                                                    href={`https://bithomp.com/explorer/${hash}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    <Stack direction="row" alignItems='center'>
                                                        {truncate(hash, 16)}
                                                        <IconButton edge="end" aria-label="bithomp">
                                                            <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 16, height: 16 }} />
                                                        </IconButton>
                                                    </Stack>
                                                </Link>

                                                <Link
                                                    // underline="none"
                                                    // color="inherit"
                                                    target="_blank"
                                                    href={`https://livenet.xrpl.org/transactions/${hash}`}
                                                    rel="noreferrer noopener nofollow"
                                                >
                                                    <IconButton edge="end" aria-label="bithomp">
                                                        <Avatar alt="livenetxrplorg" src="/static/livenetxrplorg.ico" sx={{ width: 16, height: 16 }} />
                                                    </IconButton>
                                                </Link>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </Box>
            
            </Grid>
            
            {/* Timeline */}
            
            <Grid item xs={12}  md={2.5} lg={2.5} sx={{ order: { xs: 1, lg: 2 } }}>
            <Typography variant="h2" fontSize="1.1rem">On This Day</Typography>
            <Typography variant="s7" noWrap sx={{paddingBottom: '20px'}}>
             {new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
			</Typography>
			<Typography variant="h2" fontSize="0.5rem">&nbsp;</Typography>
			<StackStyle>
  
			<Stack spacing={0.2} sx={{paddingTop: '20px', paddingBottom: '10px'}}>
			  <Stack direction="row" alignItems="center" spacing={0.5}>
				  <Avatar alt={user} src={imgUrl} sx={{ width: 28, height: 28 }} />
				  <Stack direction="row"  alignItems="baseline" spacing={0.5}>
					  
                      <Typography variant="h2" fontSize="1rem" sx={{ color: darkMode ? '#007B55' : '#5569ff' }}>{user}</Typography>
					  <Typography variant="s16">{name}</Typography>
				  </Stack>
			  </Stack>
			  
			</Stack>
			
			<div className={classes.customComponent}>
			  {histsPrices.map((value, index) => {
				const isToday = index === 0;
				const yearsAgoText = isToday ? "Today" : `${index} ${index === 1 ? "year" : "years"} ago`;

				return [
				  <div className={classes.lineContainer} key={`lineContainer-${index}`}>
						<DateRangeIcon className={classes.icon} />
						<span className={classes.yearsAgo}>{yearsAgoText}</span>
						<span className={`${classes.price} ${isToday ? classes.priceToday : ""}`} style={{ textAlign: 'right' }}>
						  ${fNumber(value)}
						</span>
				  </div>,
				  index < histsPrices.length - 1 && (
					<div className={classes.lineContainer} key={`verticalLine-${index}`}>
					  <div className={classes.verticalLine}></div>
					</div>
				  )
				];
			  })}
			</div>
			
                        <Stack direction="row" spacing={2}  alignItems="center" style={{justifyContent: 'center', paddingTop: '15px' }} >
							<Box>Share </Box>
                            <FacebookShareButton
                                url={url}
                                quote={title}
                                hashtag={"#"}
                                description={desc}
                            >
                                <FacebookIcon size={32} round />
                            </FacebookShareButton>
                            <TwitterShareButton
                                title={title}
                                url={url}
                                hashtag={"#"}
                            >
                                <TwitterIcon size={32} round />
                            </TwitterShareButton>
                        </Stack>
			
			</StackStyle>
			</Grid>

		</Grid>

            <HistoryToolbar
                count={count}
                rows={rows}
                setRows={setRows}
                page={page}
                setPage={setPage}
            />

        </>
    );
}
