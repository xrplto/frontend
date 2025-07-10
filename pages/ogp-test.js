import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Toolbar,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

function OGPTestPage({ imageUrls }) {
  return (
    <Box>
      <Toolbar id="back-to-top-anchor" />
      <Topbar />
      <Header />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h2" gutterBottom align="center" sx={{ mb: 4 }}>
          Open Graph Test Page
        </Typography>

        <Card elevation={3} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              OGP Image Gallery
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              All 9 Open Graph images for testing social media preview functionality
            </Typography>
            
            <Grid container spacing={2}>
              {imageUrls.map((url, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper elevation={2} sx={{ p: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Image {index + 1}
                    </Typography>
                    <CardMedia
                      component="img"
                      image={url}
                      alt={`OGP Image ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                        mb: 1
                      }}
                    />
                    <Typography variant="caption" sx={{ 
                      display: 'block',
                      wordBreak: 'break-all',
                      fontSize: '0.7rem'
                    }}>
                      {url.split('/').pop()}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Primary OGP Image
                </Typography>
                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                  <CardMedia
                    component="img"
                    image={imageUrls[0]}
                    alt="Primary Open Graph Image"
                    sx={{ 
                      width: '100%',
                      height: 'auto',
                      maxHeight: 400,
                      objectFit: 'contain'
                    }}
                  />
                </Paper>
                <Stack spacing={1}>
                  <Chip label="Primary Image" color="primary" />
                  <Chip label="Dimensions: 1200x630" variant="outlined" />
                  <Chip label="Format: WEBP" variant="outlined" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Social Media Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This is how your link will appear when shared:
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 150, 
                    backgroundImage: `url(${imageUrls[0]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    mb: 2
                  }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    OGP Test Page | xrpl.to
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Testing Open Graph image display functionality on XRPL.to platform
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    xrpl.to
                  </Typography>
                </Paper>
              </CardContent>
            </Card>

            <Card elevation={2} sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  OGP Tags Used
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    og:title
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    og:description
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    og:image
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    og:url
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    twitter:card
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h4" gutterBottom align="center">
            Test Your OGP Tags
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary">
            You can validate this page's Open Graph tags using tools like Facebook's Sharing Debugger or Twitter Card Validator
          </Typography>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}

export default OGPTestPage;

export async function getStaticProps() {
  const imageHashes = [
    'e5f0ebf229d8ecc45501da95d789e495',
    'ba234e3563c6fdf22c8a1724465f3365',
    '61fcbf477da5394b35b47fbf5eab38e6',
    'cd9499746c1b2e041563a9724330b3e6',
    '0413ca7cfc258dfaf698c02fe304e607',
    '3ea807e02dbf5f092d27bde3391adc8a',
    'fe8c16be4b0505d9df97e8cb12758b02'
  ];
  
  const imageUrls = [
    ...imageHashes.map(hash => `http://s1.xrpl.to/ogp/${hash}`),
    'https://s1.xrpl.to/ogp/landing.webp',
    'https://s1.xrpl.to/ogp/new.webp'
  ];
  
  const ogp = {
    canonical: 'https://xrpl.to/ogp-test',
    title: 'OGP Test Page',
    url: 'https://xrpl.to/ogp-test',
    imgUrl: imageUrls[0],
    imgType: 'image/webp',
    imgWidth: '1200',
    imgHeight: '630',
    imgAlt: 'XRPL.to Open Graph Test Image',
    desc: 'Testing Open Graph image display functionality on XRPL.to platform',
    images: imageUrls.map((url, index) => ({
      url,
      type: 'image/webp',
      width: '1200',
      height: '630',
      alt: `XRPL.to Open Graph Test Image ${index + 1}`
    }))
  };

  return {
    props: {
      ogp,
      imageUrls
    },
    revalidate: 60 // Revalidate every minute for testing
  };
}