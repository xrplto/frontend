import axios from 'axios';

const BASE_URL = process.env.API_URL || 'https://api.xrpl.to/v1';

const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
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

const normalizeTag = (tag) => {
  if (!tag) return '';
  return tag.split(' ').join('-').replace(/&/g, 'and').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
};

const Sitemap = () => null;

export const getServerSideProps = async ({ res }) => {
  try {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');

    const response = await axios.get(`${BASE_URL}/tags`, {
      timeout: 10000,
      validateStatus: (status) => status < 500
    });

    if (response.status !== 200) {
      throw new Error(`API returned ${response.status}`);
    }

    const tags = Array.isArray(response.data) ? response.data : (response.data?.tags || []);
    const time = new Date().toISOString();

    res.write('<?xml version="1.0" encoding="UTF-8"?>\n');
    res.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');

    for (const tag of tags) {
      const normalizedTag = normalizeTag(tag);
      const escapedTag = escapeXml(normalizedTag);
      if (escapedTag) {
        res.write('  <url>\n');
        res.write(`    <loc>https://xrpl.to/view/${escapedTag}</loc>\n`);
        res.write(`    <lastmod>${time}</lastmod>\n`);
        res.write('    <changefreq>daily</changefreq>\n');
        res.write('    <priority>0.7</priority>\n');
        res.write('  </url>\n');
      }
    }

    res.write('</urlset>');
    res.end();

    return { props: {} };
  } catch (error) {
    console.error('Tags sitemap generation failed:', error.message);
    const statusCode = error.response?.status || 500;
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Error generating sitemap: ${error.message}`);
    return { props: {} };
  }
};

export default Sitemap;
