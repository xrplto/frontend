// const axios = require('axios');
// const { performance } = require('perf_hooks');

// const BASE_URL = 'https://api.xrpl.to/api';
// const BASE_URL = 'http://135.181.118.217/api';

const getTokensHandler = async (req, res) => {
    // https://api.xrpl.to/api/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false
    const { amount = 1 } = req.body;

    // const {
    //     start,
    //     limit,
    //     sortBy,
    //     sortType,
    //     filter,
    //     showNew,
    //     showSlug
    // } = req.query;
   
    // let data = {};
    // try {
    //     var t1 = performance.now();

    //     const res = await axios.get(`${BASE_URL}/tokens?start=${start}&limit=${limit}&sortBy=${sortBy}&sortType=${sortType}&filter=${filter}&showNew=${showNew}&showSlug=${showSlug}`)

    //     if (res && res.data)
    //         data = res.data;

    //     var t2 = performance.now();
    //     var dt = (t2 - t1).toFixed(2);

    //     console.log(`${dt.padStart(6)}ms ${BASE_URL}/tokens`);
    // } catch (e) {
    //     console.error(e);
    // }

    // res.json(data);

    res.json({status:'ok'});
}

export default getTokensHandler
