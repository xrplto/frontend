import axios from 'axios';

const BASE_URL = process.env.API_URL;

// Enhanced XML escaping including control characters
const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
};

const Sitemap = () => null;

export const getServerSideProps = async ({ res }) => {
  try {
    // Set caching headers for better performance
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');

    const response = await axios.get(`${BASE_URL}/slugs`, {
      timeout: 10000,
      validateStatus: (status) => status < 500
    });

    if (response.status !== 200) {
      throw new Error(`API returned ${response.status}`);
    }

    const slugs = response.data?.slugs || [];
    const time = new Date().toISOString();
    const batchSize = 1000; // Process in chunks to avoid memory issues

    // Stream XML header
    res.write('<?xml version="1.0" encoding="UTF-8"?>\n');
    res.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');

    // Stream URLs in batches
    for (let i = 0; i < slugs.length; i += batchSize) {
      const batch = slugs.slice(i, i + batchSize);

      // Generate token URLs
      for (const slug of batch) {
        const escapedSlug = escapeXml(slug);
        if (escapedSlug) {
          res.write(`  <url>\n`);
          res.write(`    <loc>https://xrpl.to/token/${escapedSlug}</loc>\n`);
          res.write(`    <lastmod>${time}</lastmod>\n`);
          res.write(`    <changefreq>daily</changefreq>\n`);
          res.write(`    <priority>0.8</priority>\n`);
          res.write(`  </url>\n`);
        }
      }

      // Generate trustset URLs
      for (const slug of batch) {
        const escapedSlug = escapeXml(slug);
        if (escapedSlug) {
          res.write(`  <url>\n`);
          res.write(`    <loc>https://xrpl.to/trustset/${escapedSlug}</loc>\n`);
          res.write(`    <lastmod>${time}</lastmod>\n`);
          res.write(`    <changefreq>daily</changefreq>\n`);
          res.write(`    <priority>0.6</priority>\n`);
          res.write(`  </url>\n`);
        }
      }
    }

    // Close XML
    res.write('</urlset>');
    res.end();

    return { props: {} };
  } catch (error) {
    console.error('Sitemap generation failed:', error.message);

    // Return proper error status
    const statusCode = error.response?.status || 500;
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Error generating sitemap: ${error.message}`);

    return { props: {} };
  }
};

export default Sitemap;
