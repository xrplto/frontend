import React, { useState } from 'react';

import { Box, Container, Grid, Toolbar, Typography, Button } from '@mui/material';
import axios from 'axios';
import { performance } from 'perf_hooks';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

const sections = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const glossaryData = [
  {
    section: '#',
    terms: [
      { term: '0x Protocol', definition: '0x is a platform built on Ethereum that facilitates the seamless exchange of cryptocurrencies...' },
      { term: '1hr', definition: 'Represents data from the previous 1 hour.' },
      { term: '24hr', definition: 'Represents data from the previous 24 hours.' },
      { term: '7d', definition: 'Represents data from the previous 7 days.' },
      { term: '30d', definition: 'Represents data from the previous 30 days.' },
      { term: '401(k) Plan', definition: 'A 401(k) plan is a retirement savings program offered by companies in the United States...' },
      { term: '51% Attack', definition: 'If a single individual or a specific group controls over 50% of the computing power or mining hash rate on a network...' },
      { term: '52-Week High/Low', definition: 'A 52-week high and low represent the highest and lowest market prices that a particular asset has reached within a span of 52 weeks or one year...' },
      { term: '80/20 Rule (Pareto Principle)', definition: 'The 80/20 rule, commonly known as Pareto Principle, states that 20% of your actions account for 80% of results...' }
    ]
  },
  {
    section: 'A',
    terms: [
      { term: 'Term 2', definition: 'Definition 2' }
    ]
  },
  {
    section: 'B',
    terms: [
      { term: 'Term 3', definition: 'Definition 3' }
    ]
  },
  {
    section: 'C',
    terms: [
      { term: 'Term 4', definition: 'Definition 4' }
    ]
  },
  {
    section: 'D',
    terms: [
      { term: 'Term 5', definition: 'Definition 5' }
    ]
  },
  {
    section: 'E',
    terms: [
      { term: 'Term 6', definition: 'Definition 6' }
    ]
  },
  {
    section: 'F',
    terms: [
      { term: 'Term 7', definition: 'Definition 7' }
    ]
  },
  {
    section: 'G',
    terms: [
      { term: 'Term 8', definition: 'Definition 8' }
    ]
  },
  {
    section: 'H',
    terms: [
      { term: 'Term 9', definition: 'Definition 9' }
    ]
  },
  {
    section: 'I',
    terms: [
      { term: 'Term 10', definition: 'Definition 10' }
    ]
  },
  {
    section: 'J',
    terms: [
      { term: 'Term 11', definition: 'Definition 11' }
    ]
  },
  {
    section: 'K',
    terms: [
      { term: 'Term 12', definition: 'Definition 12' }
    ]
  },
  {
    section: 'L',
    terms: [
      { term: 'Term 13', definition: 'Definition 13' }
    ]
  },
  {
    section: 'M',
    terms: [
      { term: 'Term 14', definition: 'Definition 14' }
    ]
  },
  {
    section: 'N',
    terms: [
      { term: 'Term 15', definition: 'Definition 15' }
    ]
  },
  {
    section: 'O',
    terms: [
      { term: 'Term 16', definition: 'Definition 16' }
    ]
  },
  {
    section: 'P',
    terms: [
      { term: 'Term 17', definition: 'Definition 17' }
    ]
  },
  {
    section: 'Q',
    terms: [
      { term: 'Term 18', definition: 'Definition 18' }
    ]
  },
  {
    section: 'R',
    terms: [
      { term: 'Term 19', definition: 'Definition 19' }
    ]
  },
  {
    section: 'S',
    terms: [
      { term: 'Term 20', definition: 'Definition 20' }
    ]
  },
  {
    section: 'T',
    terms: [
      { term: 'Term 21', definition: 'Definition 21' }
    ]
  },
  {
    section: 'U',
    terms: [
      { term: 'Term 22', definition: 'Definition 22' }
    ]
  },
  {
    section: 'V',
    terms: [
      { term: 'Term 23', definition: 'Definition 23' }
    ]
  },
  {
    section: 'W',
    terms: [
      { term: 'Term 24', definition: 'Definition 24' }
    ]
  },
  {
    section: 'X',
    terms: [
      { term: 'Term 25', definition: 'Definition 25' }
    ]
  },
  {
    section: 'Y',
    terms: [
      { term: 'Term 26', definition: 'Definition 26' }
    ]
  },
  {
    section: 'Z',
    terms: [
      { term: 'Term 27', definition: 'Definition 27' }
    ]
  }
];

const Glossary = () => {
    const [searchQuery, setSearchQuery] = useState('');
  
    const handleSearchInputChange = (event) => {
      setSearchQuery(event.target.value);
    };
  
    const filteredGlossaryData = glossaryData.filter((sectionData) => {
      const filteredTerms = sectionData.terms.filter((termData) =>
        termData.term.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return filteredTerms.length > 0;
    });
  
    return (
      <Box>
        <Toolbar id="back-to-top-anchor" />
        <Topbar />
        <Header />
  
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h1" sx={{ my: 4 }}>
                XRPL Glossary
              </Typography>
  
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                {/* Search Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search terms..."
                  style={{ marginRight: '1rem' }}
                />
  
                <div>
                  {sections.map((section) => (
                    <Button key={section} href={`#section-${section}`}>
                      {section}
                    </Button>
                  ))}
                </div>
              </Box>
  
              <Grid container spacing={3}>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  {filteredGlossaryData.map((sectionData) => (
                    <Box key={sectionData.section} id={`section-${sectionData.section}`} sx={{ mb: 6 }}>
                      <Typography variant="h3" sx={{ mb: 2 }}>
                        {sectionData.section}
                      </Typography>
  
                      {sectionData.terms.map((termData) => (
                        <Box key={termData.term} sx={{ mb: 2 }}>
                          <Typography variant="h2" component="h2" sx={{ mb: 1 }}>
                            <a
                              href={`/glossary/${termData.term.toLowerCase().replace(/ /g, '-')}`}
                              style={{ textDecoration: 'none' }}
                            >
                              {termData.term}
                            </a>
                          </Typography>
                          <Typography variant="body1">
                            <a
                              href={`/glossary/${termData.term.toLowerCase().replace(/ /g, '-')}`}
                              style={{ textDecoration: 'none' }}
                            >
                              {termData.definition}
                            </a>
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
  
        <Footer />
      </Box>
    );
  };
  
  export default Glossary;

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
    // https://api.xrpl.to/api/banxa/currencies
    const BASE_URL = process.env.API_URL;
    let data = null;
    try {
        var t1 = performance.now();

        const res = await axios.get(`${BASE_URL}/banxa/currencies`);

        data = res.data;

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`2. getStaticProps fiats: ${data.fiats.length} took: ${dt}ms`);
    } catch (e) {
        console.log(e);
    }
    let ret = {};
    if (data) {
        let ogp = {};

        ogp.canonical = 'https://xrpl.to';
        ogp.title = 'Glossary';
        ogp.url = 'https://xrpl.to/';
        ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
        //ogp.desc = 'Meta description here';

        ret = {data, ogp};
    }

    return {
        props: ret, // will be passed to the page component as props
        // Next.js will attempt to re-generate the page:
        // - When a request comes in
        // - At most once every 10 seconds
        revalidate: 10, // In seconds
    }
}