import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Import the remark-gfm plugin
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useRouter } from 'next/router';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  Box,
  Divider,
  CssBaseline,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import Logo from 'src/components/Logo';
import { motion } from 'framer-motion';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const apiDocumentation = `
# XRPL.to API Documentation

## Introduction

Welcome to the XRPL.to API! You can use our API to access XRPL.to API endpoints, which can get information on various tokens' metrics in our database.

We have language bindings in Shell, JavaScript, Python and Ruby! You can view code examples in the dark area to the right, and you can switch the programming language of the examples with the tabs in the top right.

## Tokens

### Get All Tokens

\`\`\`shell
curl -sS "https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter="
\`\`\`

This endpoint retrieves tokens.

#### HTTP Request

\`GET https://api.xrpl.to/api/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=\`

#### Query Parameters

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| start | 0 | start value for pagination. |
| limit | 100 | limit count value for pagination.(limit<100) |
| sortBy | vol24hxrp | Can be one of these values: name, exch, pro24h, pro7d, vol24hxrp, vol24htx, marketcap, trustlines, supply |
| sortType | desc | asc, desc |

The parameter \`amount\` in JSON object is Total Supply value, \`supply\` is Circulating Supply Value.

### Get a Specific Token Info

\`\`\`shell
# Using issuer_currencyCode (recommended)
curl -sS "https://api.xrpl.to/api/token/rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq_USD" | jq -r '.token'

# Alternatively, you can use a slug or md5 value
slug="your_slug_here"
curl -sS "https://api.xrpl.to/api/token/your_slug_here?desc=no" | jq -r '.token'
\`\`\`

This endpoint retrieves a specific token.

#### HTTP Request

\`GET https://api.xrpl.to/api/token/<issuer>_<currencyCode>\`

or

\`GET https://api.xrpl.to/api/token/<slug>?desc=yes\`

#### URL Parameters

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| issuer_currencyCode | | The issuer address followed by an underscore and the currency code. This is the recommended method. |
| slug | | Alternatively, you can use the URL slug of the token to retrieve or md5 value of the token. Use the method described below to get the md5 value. |
| desc | no | yes or no, if yes, returns the description of the token in markdown language. |

#### Example

\`https://api.xrpl.to/api/token/rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq_USD\`

This example retrieves information about the USD token issued by GateHub (issuer address: rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq).

### Get Sparkline of a token

#### HTTP Request

\`GET https://api.xrpl.to/api/sparkline/<md5>\`

#### Parameters

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| md5 | | md5 value of the token |

#### Example

\`https://api.xrpl.to/api/sparkline/0413ca7cfc258dfaf698c02fe304e607\`

### Get MD5 value of the token

\`\`\`javascript
const CryptoJS = require('crypto-js');

const md5 = CryptoJS.MD5(issuer + '_' + currency).toString();
\`\`\`

### Get Rich List of a Token

\`\`\`shell
md5="your_md5_here"
curl -sS "https://api.xrpl.to/api/richlist/your_md5_here?start=0&limit=20"
\`\`\`

This endpoint retrieves rich list of the specific token.

#### HTTP Request

\`GET https://api.xrpl.to/api/richlist/<md5>?start=0&limit=20\`

#### Query Parameters

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| md5 | | md5 value of the token |
| start | 0 | start value for pagination. |
| limit | 100 | limit count value for pagination.(limit<100) |

You can see the example of Richlist here: https://xrpl.to/token/sologenic-solo/trustlines

### Get Exchange history of a Token

\`\`\`shell
md5="your_md5_value"
curl -s "https://api.xrpl.to/api/history?md5=your_md5_value&page=0&limit=10" | jq -r '.data.hists'
\`\`\`

This endpoint retrieves exchange history of the specific token.

#### HTTP Request

\`GET https://api.xrpl.to/api/history?md5=<md5>&page=0&limit=10\`

#### Query Parameters

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| md5 | | md5 value of the token |
| page | 0 | page number for pagination. |
| limit | 100 | limit count value for pagination.(limit<100) |

You can see the example of Exchange History here: https://xrpl.to/token/sologenic-solo/historical-data

### Get the current status

\`\`\`shell
curl -s "https://api.xrpl.to/api/status" | jq -r '.data'
\`\`\`

This endpoint retrieves the current status of the platform, or XRPL. It returns the metrics of 24 hours and Global, and the current exchange rates compared to XRP.

#### HTTP Request

\`GET https://api.xrpl.to/api/status\`

### Get Account Offers

\`\`\`shell
account="your_account_here"
curl -s "https://api.xrpl.to/api/account/your_account_here" | jq -r '.data.offers'
\`\`\`

This endpoint retrieves all offers of the account.

#### HTTP Request

\`GET https://api.xrpl.to/api/account/offers/<account>\`

## Errors

The XRPL.to API uses the following error codes:

| Error Code | Meaning |
|------------|---------|
| 400 | Bad Request -- Your request is invalid. |
| 401 | Unauthorized -- Your API key is wrong. |
| 403 | Forbidden -- The token requested is hidden for administrators only. |
| 404 | Not Found -- The specified token could not be found. |
| 405 | Method Not Allowed -- You tried to access a token with an invalid method. |
| 406 | Not Acceptable -- You requested a format that isn't json. |
| 410 | Gone -- The token requested has been removed from our servers. |
| 418 | I'm a teapot. |
| 429 | Too Many Requests -- You're requesting too many tokens! Slow down! |
| 500 | Internal Server Error -- We had a problem with our server. Try again later. |
| 503 | Service Unavailable -- We're temporarily offline for maintenance. Please try again later. |
`;

const sections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'tokens', title: 'Tokens' },
  { id: 'get-all-tokens', title: 'Get All Tokens' },
  { id: 'get-a-specific-token-info', title: 'Get a Specific Token Info' },
  { id: 'get-sparkline-of-a-token', title: 'Get Sparkline of a token' },
  { id: 'get-md5-value-of-the-token', title: 'Get MD5 value of the token' },
  { id: 'get-rich-list-of-a-token', title: 'Get Rich List of a Token' },
  { id: 'get-exchange-history-of-a-token', title: 'Get Exchange history of a Token' },
  { id: 'get-the-current-status', title: 'Get the current status' },
  { id: 'get-account-offers', title: 'Get Account Offers' },
  { id: 'errors', title: 'Errors' }
];

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3a7bd5'
    },
    secondary: {
      main: '#00d2ff'
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0'
    }
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem'
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem'
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem'
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #3a7bd5 0%, #00d2ff 100%)',
          boxShadow: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }
      }
    }
  }
});

const createHeadingComponent =
  (Tag) =>
  ({ node, ...props }) => {
    const id = React.Children.toArray(props.children)
      .filter((child) => typeof child === 'string')
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return <Tag id={id} {...props} />;
  };

const highlightText = (text, searchTerm) => {
  if (!searchTerm || typeof text !== 'string') return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.split(regex).map((part, index) =>
    regex.test(part) ? (
      <mark key={`highlight-${index}`} style={{ backgroundColor: '#FFD54F' }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const MotionListItem = motion(ListItem);

const ApiDocs = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('introduction');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedSection, setHighlightedSection] = useState(null);
  const [fullTextSearchResults, setFullTextSearchResults] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections
        .map((section) => document.getElementById(section.id))
        .filter(Boolean);

      const currentSection = sectionElements.find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom > 100;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2) {
      const headingResults = sections.filter((section) =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(headingResults);

      const fullTextResults = [];
      const lines = apiDocumentation.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
          fullTextResults.push({ line, lineNumber: index + 1 });
        }
      });
      setFullTextSearchResults(fullTextResults);
    } else {
      setSearchResults([]);
      setFullTextSearchResults([]);
    }
  }, [searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchResultClick = (sectionId) => {
    setSearchTerm('');
    setHighlightedSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightedSection(null), 3000);
    } else {
      console.warn(`Element with id "${sectionId}" not found`);
    }
  };

  const handleSectionClick = (sectionId) => {
    setHighlightedSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const appBarHeight = 64; // Adjust this value if you've changed the AppBar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - appBarHeight - 16; // Added extra 16px for padding

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightedSection(null), 3000);
    } else {
      console.warn(`Element with id "${sectionId}" not found`);
    }
  };

  const handleFullTextResultClick = (lineNumber) => {
    setSearchTerm('');
    const element = document.querySelector(`[data-line="${lineNumber}"]`);
    if (element) {
      // Scroll to the element with an offset
      const offset = 100; // Adjust this value as needed
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Highlight the element
      element.classList.add('bg-yellow-200');
      setTimeout(() => element.classList.remove('bg-yellow-200'), 3000);
    }
  };

  // Define the components object inside the ApiDocs component
  const components = {
    h1: createHeadingComponent(motion.h1),
    h2: createHeadingComponent(motion.h2),
    h3: createHeadingComponent(motion.h3),
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <Paper elevation={3} sx={{ my: 2, bgcolor: '#2d2d2d' }}>
          <SyntaxHighlighter style={tomorrow} language={match[1]} PreTag="div" {...props}>
            {typeof children === 'string' ? highlightText(children, searchTerm) : children}
          </SyntaxHighlighter>
        </Paper>
      ) : (
        <code className={className} {...props}>
          {typeof children === 'string' ? highlightText(children, searchTerm) : children}
        </code>
      );
    },
    p: ({ node, ...props }) => (
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        component={Typography}
        variant="body1"
        {...props}
        data-line={node.position?.start.line}
        id={`line-${node.position?.start.line}`}
        sx={{ my: 2, lineHeight: 1.8 }}
      >
        {typeof props.children === 'string'
          ? highlightText(props.children, searchTerm)
          : props.children}
      </motion.p>
    ),
    li: ({ node, ...props }) => (
      <ListItem
        {...props}
        data-line={node.position?.start.line}
        id={`line-${node.position?.start.line}`}
        disableGutters
      >
        <ListItemText
          primary={
            typeof props.children === 'string'
              ? highlightText(props.children, searchTerm)
              : props.children
          }
        />
      </ListItem>
    ),
    table: ({ node, ...props }) => (
      <TableContainer component={Paper} sx={{ my: 2 }}>
        <Table {...props} aria-label="documentation table">
          {props.children}
        </Table>
      </TableContainer>
    ),
    thead: ({ node, ...props }) => <TableHead {...props} />,
    tbody: ({ node, ...props }) => <TableBody {...props} />,
    tr: ({ node, ...props }) => <TableRow {...props} />,
    th: ({ node, ...props }) => (
      <TableCell
        variant="head"
        sx={{
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          fontWeight: 'bold'
        }}
        {...props}
      />
    ),
    td: ({ node, ...props }) => <TableCell {...props} />,
    blockquote: ({ node, ...props }) => (
      <Box
        component="blockquote"
        sx={{
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          pl: 2,
          my: 2,
          color: theme.palette.text.secondary
        }}
        {...props}
      />
    ),
    hr: ({ node, ...props }) => <Divider sx={{ my: 4 }} {...props} />
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Head>
          <title>XRPL.to API Documentation</title>
          <meta name="description" content="API documentation for XRPL.to" />
        </Head>

        <AppBar position="static">
          <Toolbar>
            <Logo style={{ marginRight: 2, height: 40 }} />
            <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>
              API Documentation
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ flexGrow: 1, py: 6 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  position: 'sticky',
                  top: 24,
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search documentation..."
                  value={searchTerm}
                  onChange={handleSearch}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: alpha(theme.palette.primary.main, 0.3)
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
                {(searchResults.length > 0 || fullTextSearchResults.length > 0) && (
                  <Paper elevation={1} sx={{ mb: 2, maxHeight: 400, overflow: 'auto' }}>
                    {searchResults.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100' }}>
                          Sections
                        </Typography>
                        <List>
                          {searchResults.map((result) => (
                            <ListItem
                              key={result.id}
                              button
                              onClick={() => handleSearchResultClick(result.id)}
                            >
                              <ListItemText primary={result.title} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    {fullTextSearchResults.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100' }}>
                          Content
                        </Typography>
                        <List>
                          {fullTextSearchResults.map((result) => (
                            <ListItem
                              key={`line-${result.lineNumber}`}
                              button
                              onClick={() => handleFullTextResultClick(result.lineNumber)}
                            >
                              <ListItemText
                                primary={`Line ${result.lineNumber}: ${result.line.substring(
                                  0,
                                  50
                                )}...`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Paper>
                )}
                <List>
                  {sections.map((section) => (
                    <MotionListItem
                      key={section.id}
                      button
                      selected={activeSection === section.id}
                      onClick={() => handleSectionClick(section.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&.Mui-selected': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontWeight: 600
                        }
                      }}
                    >
                      <ListItemText primary={section.title} />
                    </MotionListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={9}>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
                <ReactMarkdown
                  components={components}
                  remarkPlugins={[remarkGfm]} // Enable GFM
                >
                  {apiDocumentation}
                </ReactMarkdown>
              </Paper>
            </Grid>
          </Grid>
        </Container>

        <Box
          component="footer"
          sx={{ bgcolor: 'background.paper', color: 'text.primary', py: 3, mt: 6 }}
        >
          <Container maxWidth="lg">
            <Typography variant="body2" align="center">
              &copy; {new Date().getFullYear()} XRPL.to. All rights reserved.
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ApiDocs;
