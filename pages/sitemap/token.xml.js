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

export const getServerSideProps = async ({ res, query }) => {
  try {
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

    // Google limit: 50,000 URLs per sitemap
    // We have 2 URLs per slug (token + trustset), so max 25,000 slugs per file
    const maxSlugsPerFile = 25000;
    const page = parseInt(query.page || '0', 10);
    const start = page * maxSlugsPerFile;
    const end = start + maxSlugsPerFile;
    const pageSlugs = slugs.slice(start, end);

    if (page === 0 && slugs.length > maxSlugsPerFile) {
      // Return sitemap index for page 0 when we have multiple pages
      const totalPages = Math.ceil(slugs.length / maxSlugsPerFile);
      res.write('<?xml version="1.0" encoding="UTF-8"?>\n');
      res.write('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');

      for (let i = 0; i < totalPages; i++) {
        res.write('  <sitemap>\n');
        res.write(`    <loc>https://xrpl.to/sitemap/token.xml?page=${i}</loc>\n`);
        res.write(`    <lastmod>${time}</lastmod>\n`);
        res.write('  </sitemap>\n');
      }

      res.write('</sitemapindex>');
    } else {
      // Return actual sitemap for this page
      res.write('<?xml version="1.0" encoding="UTF-8"?>\n');
      res.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');

      for (const slug of pageSlugs) {
        const escapedSlug = escapeXml(slug);
        if (escapedSlug) {
          res.write('  <url>\n');
          res.write(`    <loc>https://xrpl.to/token/${escapedSlug}</loc>\n`);
          res.write(`    <lastmod>${time}</lastmod>\n`);
          res.write('    <changefreq>daily</changefreq>\n');
          res.write('    <priority>0.8</priority>\n');
          res.write('  </url>\n');
        }
      }

      for (const slug of pageSlugs) {
        const escapedSlug = escapeXml(slug);
        if (escapedSlug) {
          res.write('  <url>\n');
          res.write(`    <loc>https://xrpl.to/trustset/${escapedSlug}</loc>\n`);
          res.write(`    <lastmod>${time}</lastmod>\n`);
          res.write('    <changefreq>daily</changefreq>\n');
          res.write('    <priority>0.6</priority>\n');
          res.write('  </url>\n');
        }
      }

      res.write('</urlset>');
    }

    res.end();
    return { props: {} };
  } catch (error) {
    console.error('Sitemap generation failed:', error.message);
    const statusCode = error.response?.status || 500;
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Error generating sitemap: ${error.message}`);
    return { props: {} };
  }
};

export default Sitemap;
