import axios from 'axios';
import React from 'react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

import MarkdownIt from 'markdown-it';
import ReactMarkdown from 'react-markdown';
import 'react-markdown-editor-lite/lib/index.css'; // import style manually

const MDEditor = dynamic(() => import('react-markdown-editor-lite'), {
  ssr: false
});

// Material
import { Grid, Stack, useTheme, useMediaQuery, Typography, Paper, Button } from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import PriceChart from './PriceChartLightweightSSR';
import PriceStatistics from './PriceStatistics';
import Description from './Description';
import TrendingTokens from './TrendingTokens';

import Swap from './Swap'; // Import Swap component
import TradingHistory from './TradingHistory';

// ----------------------------------------------------------------------

export default function Overview({ token }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const BASE_URL = process.env.API_URL;
  const { accountProfile, setLoading, openSnackbar } = useContext(AppContext);

  const [showEditor, setShowEditor] = useState(false);
  const [description, setDescription] = useState(token.description || '');
  const [pairs, setPairs] = useState([]);

  // Initialize a markdown parser
  const mdParser = new MarkdownIt(/* Markdown-it options */);

  const handleEditorChange = ({ html, text }) => {
    // console.log('handleEditorChange', html, text);
    setDescription(text);
  };

  // Fetch pairs data
  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const response = await fetch(`${BASE_URL}/pairs?md5=${token.md5}`);
        const data = await response.json();
        if (data.pairs) {
          setPairs(data.pairs);
        }
      } catch (error) {
        console.error('Error fetching pairs:', error);
      }
    };

    if (token.md5) {
      fetchPairs();
    }
  }, [token.md5, BASE_URL]);

  const onApplyDescription = async () => {
    if (token.description === description) return;

    let finish = false;
    setLoading(true);
    try {
      let res;

      const accountAdmin = accountProfile.account;
      const accountToken = accountProfile.token;

      const body = { md5: token.md5, description };

      res = await axios.post(`${BASE_URL}/admin/update_description`, body, {
        headers: { 'x-access-account': accountAdmin, 'x-access-token': accountToken }
      });

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          token.description = description;
          openSnackbar('Successful!', 'success');
          finish = true;
        } else {
          // { status: false, data: null, err: 'ERR_URL_SLUG' }
          const err = ret.err;
          openSnackbar(err, 'error');
        }
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
    if (finish) setShowEditor(false);
  };

  let user = token.user;
  if (!user) user = token.name;

  return (
    <Grid container spacing={{ xs: 0, md: 3 }}>
      <Grid item xs={12} md={12} lg={8}>
        <PriceChart token={token} />
        {!isMobile && !isTablet && (
          <>
            <TradingHistory tokenId={token.md5} amm={token.AMM} token={token} pairs={pairs} />
            {showEditor && (
              <MDEditor
                value={description}
                renderHTML={(text) => mdParser.render(text)}
                onChange={handleEditorChange}
                style={{ height: '500px' }}
              />
            )}
            {/* <MDEditor value={description} renderHTML={text => <ReactMarkdown children={text} />} onChange={handleEditorChange} style={{ height: '500px' }} /> */}
          </>
        )}
      </Grid>
      <Grid item xs={12} md={12} lg={4}>
        <Swap token={token} />
        <PriceStatistics token={token} sx={{ mt: 3 }} />
        <Description
          token={token}
          showEditor={showEditor}
          setShowEditor={setShowEditor}
          description={description}
          onApplyDescription={onApplyDescription}
        />
        {showEditor && (
          <MDEditor
            value={description}
            renderHTML={(text) => mdParser.render(text)}
            onChange={handleEditorChange}
            style={{ height: '500px' }}
          />
        )}
        <TrendingTokens />
      </Grid>
    </Grid>
  );
}
