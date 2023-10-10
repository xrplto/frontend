import React from "react";
import axios from 'axios';
import { performance } from 'perf_hooks';

const Sitemap = () => {};

const BASE_URL = process.env.API_URL;

export const getServerSideProps = async ({ res }) => {
    let slugs = [];
    let count = 0;
    const time = new Date().toISOString();
    try {
        var t1 = performance.now();

        const res = await axios.get(`${BASE_URL}/slugs`);

        count = res.data?.count;
        slugs = res.data?.slugs;

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`3. sitemap/token.xml count: ${count} took: ${dt}ms [${time}]`);
    } catch (e) {
        console.log(e);
    }

    /* =============================
        // Change freq
            always = describe documents that change each time they are accessed
            hourly
            daily
            weekly
            monthly
            yearly
            never = describe archived URLs
    =============================*/
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://xrpl.to/</loc>
        <lastmod>${time}</lastmod>
        <changefreq>always</changefreq>
    </url>
    ${slugs.map((slug) => {
    return `
    <url>
        <loc>https://xrpl.to/token/${slug}</loc>
        <lastmod>${time}</lastmod>
        <changefreq>always</changefreq>
    </url>`}).join('')
    }
    ${slugs.map((slug) => {
    return `
    <url>
        <loc>https://xrpl.to/trustset/${slug}</loc>
        <lastmod>${time}</lastmod>
        <changefreq>always</changefreq>
    </url>`}).join('')
    }
</urlset>
    `;

    res.setHeader("Content-Type", "text/xml");
    res.write(sitemap);
    res.end();

    return {
        props: {},
    };
};

export default Sitemap;