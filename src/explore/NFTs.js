import axios from 'axios';
import React, {
    useState,
    useEffect,
    useContext,
    useCallback,
    useMemo
} from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import debounce from 'lodash.debounce';

// Material
import {
    useTheme,
    useMediaQuery,
    Box,
    Grid,
    IconButton,
    InputAdornment,
    TextField
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

// Loader
import { ClipLoader } from 'react-spinners';

// Components
import NFTCard from './NFTCard';
import FilterDetail from './FilterDetail';
import { AppContext } from 'src/AppContext';

export default function NFTs({ collection }) {
    const BASE_URL = 'https://api.xrpnft.com/api';

    const theme = useTheme();
    const { setDeletingNfts } = useContext(AppContext);

    const [nfts, setNfts] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [flag, setFlag] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [filter, setFilter] = useState(0);
    const [subFilter, setSubFilter] = useState(0);
    const [filterAttrs, setFilterAttrs] = useState([]);
    const [sync, setSync] = useState(0);
    const [attrSync, setAttrSync] = useState(0);

    const fetchNfts = useCallback(() => {
        setLoading(true);
        const limit = 32; // 20 per page
        const body = {
            page,
            limit,
            flag,
            cid: collection?.uuid,
            search,
            filter,
            subFilter,
            filterAttrs
        };

        axios
            .post(`${BASE_URL}/nfts`, body)
            .then((res) => {
                const newNfts = res.data.nfts;
                const length = newNfts.length;
                setHasMore(length === limit);
                setNfts((prevNfts) => [...prevNfts, ...newNfts]);
                setDeletingNfts((prevNfts) => [...prevNfts, ...newNfts]);
            })
            .catch((err) => {
                console.log('Error on getting nfts!', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }/*, [page, flag, search, filter, subFilter, filterAttrs, collection?.uuid]*/);

    useEffect(() => {
        setNfts([]);
        setDeletingNfts([]);
        setPage(0);
        setHasMore(true);
        ///setSync((prevSync) => prevSync + 1); // webxtor: disable duplicate loading on start
    }, [flag, search, filter, subFilter, attrSync, filterAttrs]);

    useEffect(() => {
        fetchNfts();
    }, [sync/*, fetchNfts*/, flag, search, filter, subFilter, attrSync, filterAttrs]);

    const handleChangeSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleShowFilter = () => {
        setShowFilter((prevShow) => !prevShow);
    };

    const handleRemove = (NFTokenID) => {
        setLoading(true);
        axios
            .delete(`${BASE_URL}/nfts`, {
                data: {
                    issuer: collection?.account,
                    taxon: collection?.taxon,
                    cid: collection?.uuid,
                    idsToDelete: NFTokenID
                }
            })
            .then((res) => {
                location.reload();
            })
            .catch((err) => {
                console.log('Error on removing nfts!', err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // useMemo to avoid unnecessary re-renders
    const inputProps = useMemo(
        () => ({
            startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.7 }}>
                    <SearchIcon />
                </InputAdornment>
            ),
            endAdornment: (
                <InputAdornment position="start">
                    {loading && <ClipLoader color="#ff0000" size={15} />}
                </InputAdornment>
            )
        }),
        [loading]
    );

    return (
        <>
            <Box display="flex" alignItems="center">
                <IconButton aria-label="filter" onClick={handleShowFilter}>
                    <FilterListIcon fontSize="large" />
                </IconButton>
                <TextField
                    id="textFilter"
                    fullWidth
                    variant="outlined"
                    placeholder="Search by name or attribute"
                    margin="dense"
                    onChange={handleChangeSearch}
                    autoComplete="new-password"
                    inputProps={{ autoComplete: 'off' }}
                    value={search}
                    onFocus={(event) => event.target.select()}
                    sx={{ pl: 2, pr: 0, pt: 0, pb: 0, mt: 0 }}
                    onKeyDown={(e) => e.stopPropagation()}
                    InputProps={inputProps}
                />
            </Box>
            <Grid container spacing={1} justifyContent="space-between" mt={1}>
                {showFilter && (
                    <Grid item xs={12} md={3} xl={2} pt={0.5}>
                        <FilterDetail
                            collection={collection}
                            filter={filter}
                            setFilter={setFilter}
                            subFilter={subFilter}
                            setSubFilter={setSubFilter}
                            setFilterAttrs={setFilterAttrs}
                            setPage={setPage}
                        />
                    </Grid>
                )}
                <Grid
                    item
                    xs={12}
                    md={showFilter ? 9 : 12}
                    xl={showFilter ? 10 : 12}
                >
                    <InfiniteScroll
                        dataLength={nfts.length}
                        next={() => {
                            setPage((prevPage) => prevPage + 1);
                            setSync((prevSync) => prevSync + 1);
                        }}
                        hasMore={hasMore}
                        scrollThreshold={0.6}
                    >
                        <Grid container spacing={1}>
                            {nfts.map((nft, index) => (
                                <Grid
                                    item
                                    xs={6}
                                    sm={4}
                                    md={3}
                                    lg={2.4}
                                    xl={1.5}
                                    key={index}
                                >
                                    <NFTCard
                                        nft={nft}
                                        handleRemove={handleRemove}
                                        // Assuming NFTCard accepts a component for the image
                                        imageComponent={
                                            <LazyLoadImage
                                                src={nft.imageUrl} // Replace with your image source
                                                alt={nft.name}
                                                effect="blur" // Optional: add a blur effect while loading
                                            />
                                        }
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </InfiniteScroll>
                </Grid>
            </Grid>
        </>
    );
}
