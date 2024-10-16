import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import unified from 'unified';
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
  Chip,
  Tabs,
  Tab,
  Button,
  Modal,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import Logo from 'src/components/Logo';
import { motion } from 'framer-motion';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axios from 'axios';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ApiDocumentation from './ApiDocumentation';
import CodeExamples from './CodeExamples';
import CryptoJS from 'crypto-js';

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
      main: '#25A768' // XRP Ledger green
    },
    secondary: {
      main: '#3E4348' // XRP Ledger dark gray
    },
    background: {
      default: '#000000',
      paper: '#1E2329'
    },
    text: {
      primary: '#ffffff',
      secondary: '#B7BDC6'
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
          background: 'linear-gradient(90deg, #000000 0%, #000000 60%, #25A768 100%)', // Dark black with XRP Ledger green gradient on the right
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
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
      <mark key={`highlight-${part}-${index}`} style={{ backgroundColor: '#FFD54F' }}>
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
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentSection, setCurrentSection] = useState('get-all-tokens');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [codeSampleRef, setCodeSampleRef] = useState(null);
  const [markdownError, setMarkdownError] = useState(null);

  const apiDocumentation = ApiDocumentation();
  const { getCodeExample } = CodeExamples();

  const handleCodeLanguageChange = (event, newValue) => {
    setCodeLanguage(newValue);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections
        .map((section) => document.getElementById(section.id))
        .filter(Boolean);

      // Find the current section
      let currentSection = null;
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const element = sectionElements[i];
        const rect = element.getBoundingClientRect();
        if (rect.top <= 100) {
          currentSection = element;
          break;
        }
      }

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

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setIsLoading(true);
    try {
      let response;
      switch (currentSection) {
        case 'get-all-tokens':
          response = await axios.get(
            'https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter='
          );
          break;
        case 'get-specific-token-info':
          response = await axios.get(
            'https://api.xrpl.to/api/token/rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq_USD'
          );
          break;
        case 'get-sparkline-of-a-token':
          response = await axios.get(
            'https://api.xrpl.to/api/sparkline/0413ca7cfc258dfaf698c02fe304e607'
          );
          break;
        case 'get-rich-list-of-a-token':
          response = await axios.get(
            'https://api.xrpl.to/api/richlist/0413ca7cfc258dfaf698c02fe304e607?start=0&limit=20'
          );
          break;
        case 'get-exchange-history-of-a-token':
          response = await axios.get(
            'https://api.xrpl.to/api/history?md5=0413ca7cfc258dfaf698c02fe304e607&page=0&limit=10'
          );
          break;
        case 'get-the-current-status':
          response = await axios.get('https://api.xrpl.to/api/status');
          break;
        case 'get-account-offers':
          response = await axios.get(
            'https://api.xrpl.to/api/account/offers/rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6'
          );
          break;
        default:
          throw new Error('Invalid section');
      }
      setApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching API data:', error);
      setApiResponse({ error: 'Failed to fetch data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setApiResponse(null);
  };

  const handleCopyResponse = () => {
    navigator.clipboard
      .writeText(JSON.stringify(apiResponse, null, 2))
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => console.error('Failed to copy text: ', err));
  };

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    // If the section is "get-md5-value-of-the-token", generate an example MD5
    if (section === 'get-md5-value-of-the-token') {
      const issuer = 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq';
      const currency = 'USD';
      const md5 = CryptoJS.MD5(issuer + '_' + currency).toString();
      console.log('Example MD5:', md5);
    }
    // Scroll to the corresponding section in the documentation
    const sectionElement = document.getElementById(section);
    if (sectionElement) {
      const appBarHeight = 64; // Adjust this value if you've changed the AppBar height
      const elementPosition = sectionElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - appBarHeight - 16;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }

    // Scroll the code sample section to the top
    if (codeSampleRef) {
      codeSampleRef.scrollTop = 0;
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Add this new component for section headers
  const SectionHeader = ({ children }) => (
    <Typography
      variant="h2"
      sx={{
        mt: 6,
        mb: 3,
        pb: 2,
        borderBottom: `2px solid ${theme.palette.primary.main}`,
        color: theme.palette.primary.main
      }}
    >
      {children}
    </Typography>
  );

  // Update the components object to include the new SectionHeader
  const components = {
    h1: createHeadingComponent(motion.h1),
    h2: ({ node, ...props }) => <SectionHeader {...props} />,
    h3: createHeadingComponent(({ children, ...props }) => (
      <Typography
        variant="h3"
        sx={{
          mt: 4,
          mb: 2,
          color: theme.palette.secondary.main
        }}
        {...props}
      >
        {children}
      </Typography>
    )),
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <Paper elevation={3} sx={{ my: 2, bgcolor: '#2d2d2d' }}>
          <SyntaxHighlighter style={tomorrow} language={match[1]} PreTag="div" {...props}>
            {typeof children === 'string' ? highlightText(children, searchTerm) : children}
          </SyntaxHighlighter>
        </Paper>
      ) : (
        <code
          className={className}
          {...props}
          style={{
            backgroundColor: '#2d2d2d',
            color: '#e6e6e6',
            padding: '2px 4px',
            borderRadius: '4px',
            fontFamily: '"Roboto Mono", monospace',
            fontSize: '0.9em'
          }}
        >
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

  const safeRemarkGfm = () => {
    try {
      return remarkGfm();
    } catch (error) {
      console.error('Error in remarkGfm:', error);
      return [];
    }
  };

  const safeParse = (content) => {
    try {
      return unified().use(remarkParse).use(safeRemarkGfm).parse(content);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      setMarkdownError('There was an error parsing the documentation. Please try again later.');
      return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Head>
          <title>XRPL.to API Documentation</title>
          <meta name="description" content="API documentation for XRPL.to" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <AppBar position="sticky">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleSidebar}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Logo style={{ height: 28, marginRight: 2 }} />
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                API Docs
              </Typography>
            </Box>
            <Box
              sx={{
                width: '30%',
                height: 4,
                background: 'linear-gradient(90deg, transparent 0%, #25A768 100%)'
              }}
            />
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box
            component="nav"
            sx={{
              width: { sm: 280 },
              flexShrink: 0,
              display: { xs: isSidebarOpen ? 'block' : 'none', sm: 'block' },
              position: { xs: 'fixed', sm: 'sticky' },
              top: 0,
              left: 0,
              height: '100vh',
              overflowY: 'auto',
              zIndex: 1200,
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
              p: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={toggleSidebar} sx={{ display: { sm: 'none' } }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{ mb: 2 }}
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
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 4 },
              width: { xs: '100%', md: '50%' },
              overflowY: 'auto',
              borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` }
            }}
          >
            {markdownError ? (
              <Typography color="error">{markdownError}</Typography>
            ) : (
              <ReactMarkdown
                components={components}
                remarkPlugins={[safeRemarkGfm]}
                parserOptions={{ parse: safeParse }}
              >
                {apiDocumentation}
              </ReactMarkdown>
            )}
          </Box>

          <Divider sx={{ display: { xs: 'block', md: 'none' }, my: 2 }} />

          <Box
            sx={{
              flexGrow: 1,
              p: 2,
              bgcolor: '#2d2d2d',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              height: { xs: 'auto', md: 'calc(100vh - 64px)' },
              width: { xs: '100%', md: '50%' },
              position: { md: 'sticky' },
              top: { md: 64 },
              alignSelf: { md: 'flex-start' }
            }}
            ref={setCodeSampleRef}
          >
            <Typography variant="h6" gutterBottom>
              Code Examples
            </Typography>
            <TabContext value={currentSection}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList
                  onChange={(event, newValue) => handleSectionChange(newValue)}
                  aria-label="code section tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    maxWidth: '100%',
                    '& .MuiTab-root': {
                      minHeight: '48px',
                      fontSize: '0.8rem',
                      textTransform: 'none'
                    }
                  }}
                >
                  <Tab label="Get All Tokens" value="get-all-tokens" />
                  <Tab label="Get Specific Token Info" value="get-specific-token-info" />
                  <Tab label="Get Sparkline" value="get-sparkline-of-a-token" />
                  <Tab label="Get MD5 Value" value="get-md5-value-of-the-token" />
                  <Tab label="Get Rich List" value="get-rich-list-of-a-token" />
                  <Tab label="Get Exchange History" value="get-exchange-history-of-a-token" />
                  <Tab label="Get Current Status" value="get-the-current-status" />
                  <Tab label="Get Account Offers" value="get-account-offers" />
                </TabList>
              </Box>
              <TabPanel
                value={currentSection}
                sx={{
                  p: 0,
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'auto'
                }}
              >
                <Tabs
                  value={codeLanguage}
                  onChange={handleCodeLanguageChange}
                  aria-label="code language tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    mb: 2,
                    '& .MuiTab-root': {
                      minHeight: '36px',
                      fontSize: '0.8rem',
                      textTransform: 'none'
                    }
                  }}
                >
                  <Tab label="JavaScript" value="javascript" />
                  <Tab label="Python" value="python" />
                  <Tab label="Shell" value="shell" />
                  <Tab label="Ruby" value="ruby" />
                </Tabs>
                <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: { xs: '300px', md: 'none' } }}>
                  <SyntaxHighlighter
                    language={codeLanguage}
                    style={tomorrow}
                    customStyle={{ fontSize: '0.9rem' }}
                  >
                    {getCodeExample(codeLanguage, currentSection)}
                  </SyntaxHighlighter>
                </Box>
                {currentSection !== 'get-md5-value-of-the-token' && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOpenModal}
                    sx={{ mt: 2, alignSelf: 'flex-start' }}
                  >
                    Try it out
                  </Button>
                )}
              </TabPanel>
            </TabContext>
          </Box>
        </Box>

        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          aria-labelledby="api-response-modal"
          aria-describedby="api-response-description"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%' },
              maxHeight: '80%',
              bgcolor: 'background.paper',
              border: '2px solid #000',
              boxShadow: 24,
              p: { xs: 2, sm: 4 },
              overflowY: 'auto'
            }}
          >
            <Typography
              id="api-response-modal"
              variant="h6"
              component="h2"
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              API Response
              {!isLoading && apiResponse && (
                <Tooltip title={copySuccess ? 'Copied!' : 'Copy to clipboard'}>
                  <IconButton onClick={handleCopyResponse} size="small">
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Typography>
            {isLoading ? (
              <CircularProgress />
            ) : (
              <SyntaxHighlighter language="json" style={tomorrow}>
                {JSON.stringify(apiResponse, null, 2)}
              </SyntaxHighlighter>
            )}
            <Button onClick={handleCloseModal}>Close</Button>
          </Box>
        </Modal>

        <Box component="footer" sx={{ bgcolor: 'background.paper', color: 'text.primary', py: 3 }}>
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