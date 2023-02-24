import React from 'react';
import dynamic from "next/dynamic";
import { useState, useEffect } from 'react';

import MarkdownIt from 'markdown-it';
import ReactMarkdown from "react-markdown";
import "react-markdown-editor-lite/lib/index.css"; // import style manually

const MDEditor = dynamic(() => import("react-markdown-editor-lite"), {
    ssr: false
});

// Material
import {
    Grid,
    Stack
} from '@mui/material';

// Components
import PriceChart from './PriceChart';
import PriceStatistics from './PriceStatistics';
import Description from './Description';

// ----------------------------------------------------------------------

export default function Overview({token}) {
    const [showEditor, setShowEditor] = useState(false);
    const [description, setDescription] = useState(token.description || "");

    // Initialize a markdown parser
    const mdParser = new MarkdownIt(/* Markdown-it options */);

    const handleEditorChange = ({ html, text }) => {
        // console.log('handleEditorChange', html, text);
        setDescription(text);
    }

    const onApplyDescription = () => {

    }

    return (
        <Grid container spacing={{ xs: 0, md: 3 }}>
            <Grid item xs={12} md={12} lg={8}>
                <PriceChart token={token} />
            </Grid>

            <Grid item xs={12} md={12} lg={4}>
                <PriceStatistics token={token} />
            </Grid>

            <Grid item xs={12} md={12} lg={8}>
                <Description
                    token={token}
                    showEditor={showEditor}
                    setShowEditor={setShowEditor}
                    description={description}
                    onApplyDescription={onApplyDescription}
                />
            </Grid>

            <Grid item xs={12} md={12} lg={12}>
                {showEditor &&
                    <MDEditor value={description} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange} style={{ height: '500px' }} />
                }

                {/* <MDEditor value={description} renderHTML={text => <ReactMarkdown children={text} />} onChange={handleEditorChange} style={{ height: '500px' }} /> */}
            </Grid>
        </Grid>
    );
}
