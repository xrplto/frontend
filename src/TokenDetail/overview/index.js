import React, { useState, useContext, useMemo } from 'react';
import dynamic from "next/dynamic";
import axios from 'axios';
import MarkdownIt from 'markdown-it';
// import ReactMarkdown from "react-markdown"; // Removed as it's not being used

const MDEditor = dynamic(() => import("react-markdown-editor-lite"), {
    ssr: false
});

// Material
import {
    Grid,
    useTheme, useMediaQuery,
} from '@mui/material';

// Context
import { AppContext } from 'src/AppContext';

// Components
import PriceChart from './PriceChart';
import PriceStatistics from './PriceStatistics';
import Description from './Description';
import TrendingTokens from './TrendingTokens';
import Swap from './Swap';
import Poll from './Poll';

// ----------------------------------------------------------------------

export default function Overview({ token }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const BASE_URL = process.env.API_URL;
    const { accountProfile, setLoading, openSnackbar } = useContext(AppContext);

    const [showEditor, setShowEditor] = useState(false);
    const [description, setDescription] = useState(token.description || "");

    // Memoize the markdown parser
    const mdParser = useMemo(() => new MarkdownIt(/* Markdown-it options */), []);

    // Memoize the editor change handler
    const handleEditorChange = useMemo(() => ({ text }) => {
        setDescription(text);
    }, []);

    // Memoize the apply description function
    const onApplyDescription = useMemo(() => async () => {
        if (token.description === description) return;

        setLoading(true);
        try {
            const { account: accountAdmin, token: accountToken } = accountProfile;
            const { data } = await axios.post(`${BASE_URL}/admin/update_description`, 
                { md5: token.md5, description }, 
                { headers: { 'x-access-account': accountAdmin, 'x-access-token': accountToken } }
            );

            if (data.status) {
                token.description = description;
                openSnackbar('Successful!', 'success');
                setShowEditor(false);
            } else {
                openSnackbar(data.err, 'error');
            }
        } catch (err) {
            console.error(err);
            openSnackbar('An error occurred', 'error');
        }
        setLoading(false);
    }, [token, description, accountProfile, BASE_URL, openSnackbar, setLoading]);

    let user = token.user;
    if (!user) user = token.name;

    return (
        <Grid container spacing={{ xs: 0, md: 3 }}>
            <Grid item xs={12} md={12} lg={8}>
                <PriceChart token={token} />
                {(!isMobile && !isTablet) && (
                    <>
                        <Description
                            token={token}
                            showEditor={showEditor}
                            setShowEditor={setShowEditor}
                            description={description}
                            onApplyDescription={onApplyDescription}
                        />
                        {showEditor &&
                            <MDEditor value={description} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange} style={{ height: '500px' }} />
                        }
                        {/* <MDEditor value={description} renderHTML={text => <ReactMarkdown children={text} />} onChange={handleEditorChange} style={{ height: '500px' }} /> */}
                    </>
                )}
                <Poll user={user} name={token.name} /> {/* Pass user and name as props */}
            </Grid>
            <Grid item xs={12} md={12} lg={4}>
                <Swap token={token}/>
                <PriceStatistics token={token} />
                <TrendingTokens />
            </Grid>
            {(isMobile || isTablet) && (
                <>
                    <Description
                        token={token}
                        showEditor={showEditor}
                        setShowEditor={setShowEditor}
                        description={description}
                        onApplyDescription={onApplyDescription}
                    />
                    {showEditor &&
                        <MDEditor value={description} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange} style={{ height: '500px' }} />
                    }
                    {/* <MDEditor value={description} renderHTML={text => <ReactMarkdown children={text} />} onChange={handleEditorChange} style={{ height: '500px' }} /> */}
                </>
            )}
        </Grid>
    );
}