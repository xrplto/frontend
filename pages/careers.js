import React from 'react';
import { Box, Container, Grid, Typography, Button, LinearProgress  } from '@mui/material';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import UserFocusedIcon from '@mui/icons-material/Person';
import CollaborationIcon from '@mui/icons-material/Group';
import HardcoreIcon from '@mui/icons-material/Whatshot';
import FreedomIcon from '@mui/icons-material/Favorite';
import HumilityIcon from '@mui/icons-material/Accessibility';

function CareersPage() {
  return (
    <Box>
      <Topbar />
      <Header />

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h1" sx={{ mb: 2 }}>Careers at xrpl.to</Typography>
        <Typography variant="subtitle1" sx={{ mb: 4 }}>
          Showcasing innovation on the XRPL ecosystem.
        </Typography>

        <Typography variant="h2" sx={{ mb: 2 }}>Our Values</Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <UserFocusedIcon sx={{ fontSize: 48 }} />
              <Typography variant="h3" sx={{ mb: 1 }}>User-Focused</Typography>
              <Typography variant="body2">
                We protect our users by putting their needs first and delivering quality service.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <CollaborationIcon sx={{ fontSize: 48 }} />
              <Typography variant="h3" sx={{ mb: 1 }}>Collaboration</Typography>
              <Typography variant="body2">
                We communicate openly and work as a team towards shared goals to build the ecosystem together.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <HardcoreIcon sx={{ fontSize: 48 }} />
              <Typography variant="h3" sx={{ mb: 1 }}>Hardcore</Typography>
              <Typography variant="body2">
                We are results-driven, passionate, and resilient. We learn fast and pick ourselves up when we fail.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <FreedomIcon sx={{ fontSize: 48 }} />
              <Typography variant="h3" sx={{ mb: 1 }}>Freedom</Typography>
              <Typography variant="body2">
                We execute responsibly and autonomously, empower those around us, and challenge the status quo.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <HumilityIcon sx={{ fontSize: 48 }} />
              <Typography variant="h3" sx={{ mb: 1 }}>Humility</Typography>
              <Typography variant="body2">
                We accept critical feedback, treat everyone as equals, and remain modest about our success.
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h2" sx={{ mb: 2 }}>Why Work Here</Typography>
        <Box component="ul" sx={{ pl: 3, mb: 4 }}>
          <li>We are proud to offer competitive benefits that enable healthy and fulfilling careers at xrpl.to</li>
          <li>Competitive salary</li>
          <li>Option to be paid in crypto</li>
          <li>Flexible working hours</li>
          <li>Remote work for many roles</li>
          <li>Team building activities</li>
          <li>And other various perks and benefits</li>
          <li>Learning and development programs</li>
          <li>International transfers mid-career</li>
        </Box>

        <Typography variant="h2" sx={{ mb: 2 }}>Choose Your Jobs</Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Select a job most relevant to your interests and experience to view.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography variant="h3">Content Lead</Typography>
              <Typography variant="subtitle2">Global / Marketing</Typography>
              <Button variant="contained" color="primary">Apply</Button>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography variant="h3">Senior Web Developer</Typography>
              <Typography variant="subtitle2">Engineering</Typography>
              <Button variant="contained" color="primary">Apply</Button>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography variant="h3">Senior Data Scientist</Typography>
              <Typography variant="subtitle2">Data & Research</Typography>
              <Button variant="contained" color="primary">Apply</Button>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography variant="h3">Senior / Junior Engineer</Typography>
              <Typography variant="subtitle2">XRPL Developer</Typography>
              <Button variant="contained" color="primary">Apply</Button>
            </Box>
          </Grid>
        </Grid>
        

        <Box sx={{ mt: 2 }}>
        <Typography variant="h2" sx={{ mb: 2 }}>How We Hire</Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={3}>
            <Box>
              <Typography variant="h3" sx={{ mb: 1 }}>Application Review</Typography>
              <Typography variant="body2">01</Typography>
              <LinearProgress variant="determinate" value={25} />
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box>
              <Typography variant="h3" sx={{ mb: 1 }}>Interviews</Typography>
              <Typography variant="body2">02</Typography>
              <LinearProgress variant="determinate" value={50} />
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box>
              <Typography variant="h3" sx={{ mb: 1 }}>Offer</Typography>
              <Typography variant="body2">03</Typography>
              <LinearProgress variant="determinate" value={75} />
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box>
              <Typography variant="h3" sx={{ mb: 1 }}>Onboarding</Typography>
              <Typography variant="body2">After accepting the offer</Typography>
              <LinearProgress variant="determinate" value={100} />
            </Box>
          </Grid>
        </Grid>
      </Box>
      </Container>

      <Footer />
    </Box>
  );
}

export default CareersPage;
