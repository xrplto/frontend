import React from 'react';
import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = process.env.API_URL;

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
let sitemapCache = {
  data: null,
  timestamp: 0,
  isGenerating: false
};

// Function to escape XML special characters
const escapeXml = (unsafe) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
};

// Optimized sitemap generation using arrays instead of string concatenation
const generateSitemapXml = (slugs, timestamp) => {
  const urls = [];
  
  // Add token URLs
  for (let i = 0; i < slugs.length; i++) {
    urls.push(`    <url>
        <loc>https://xrpl.to/token/${escapeXml(slugs[i])}</loc>
        <lastmod>${timestamp}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`);
  }
  
  // Add trustset URLs
  for (let i = 0; i < slugs.length; i++) {
    urls.push(`    <url>
        <loc>https://xrpl.to/trustset/${escapeXml(slugs[i])}</loc>
        <lastmod>${timestamp}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>`);
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
};

const Sitemap = () => {
  // This component does not render anything, as it's meant for server-side generation only.
  return null;
};

export const getServerSideProps = async ({ res }) => {
  const startTime = performance.now();
  
  try {
    // Set response headers early
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, max-age=900'); // Cache for 15 minutes
    
    // Check if we have valid cached data
    const now = Date.now();
    const isCacheValid = sitemapCache.data && (now - sitemapCache.timestamp) < CACHE_DURATION;
    
    if (isCacheValid) {
      const endTime = performance.now();
      console.log(`Sitemap served from cache in ${(endTime - startTime).toFixed(2)}ms`);
      
      res.write(sitemapCache.data);
      res.end();
      return { props: {} };
    }
    
    // Prevent multiple simultaneous generations
    if (sitemapCache.isGenerating) {
      // If cache is being generated, wait a bit and serve stale data if available
      if (sitemapCache.data) {
        console.log('Serving stale sitemap while regenerating...');
        res.write(sitemapCache.data);
        res.end();
        return { props: {} };
      }
    }
    
    sitemapCache.isGenerating = true;
    
    // Fetch data with timeout - using /tokens endpoint since /slugs may not exist
    const response = await axios.get(`${BASE_URL}/tokens`, {
      params: {
        start: 0,
        limit: 10000, // Get a large number of tokens
        sortBy: 'vol24hxrp',
        sortType: 'desc',
        showSlug: 'true' // Request slug data if supported
      },
      timeout: 15000, // 15 second timeout for large dataset
      headers: {
        'User-Agent': 'XRPL.to-Sitemap-Generator'
      }
    });
    
    const tokens = response.data?.tokens || response.data || [];
    
    // Extract slugs from token data
    const slugs = tokens
      .map(token => {
        // Try different slug properties that might exist
        return token.slug || token.md5 || `${token.issuer}_${token.currency}`;
      })
      .filter(slug => slug && slug.length > 0);
    
    const count = slugs.length;
    
    if (!Array.isArray(slugs) || slugs.length === 0) {
      throw new Error('Invalid or empty slugs data received from API');
    }
    
    const timestamp = new Date().toISOString();
    const sitemap = generateSitemapXml(slugs, timestamp);
    
    // Update cache
    sitemapCache.data = sitemap;
    sitemapCache.timestamp = now;
    sitemapCache.isGenerating = false;
    
    const endTime = performance.now();
    const elapsedTime = (endTime - startTime).toFixed(2);
    
    console.log(`Sitemap generated: ${count} tokens/trustsets, ${Math.floor(sitemap.length / 1024)}KB in ${elapsedTime}ms`);
    
    res.write(sitemap);
    res.end();
    
    return { props: {} };
    
  } catch (error) {
    sitemapCache.isGenerating = false;
    console.error('Error generating sitemap:', error.message || error);
    
    // Try to serve stale cache if available
    if (sitemapCache.data) {
      console.log('Serving stale sitemap due to error...');
      res.write(sitemapCache.data);
      res.end();
      return { props: {} };
    }
    
    // Generate minimal fallback sitemap
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://xrpl.to/trending</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
</urlset>`;
    
    res.statusCode = 200; // Don't return 500 for SEO reasons
    res.write(fallbackSitemap);
    res.end();
    
    return { props: {} };
  }
};

export default Sitemap;
