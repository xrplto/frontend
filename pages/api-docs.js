import React, { useState, useContext } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { Copy, Menu, X, CheckCircle, Code, Search, Loader2 } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

const ApiDocsPage = () => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [currentSection, setCurrentSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'tokens', title: 'Tokens' },
    { id: 'token-details', title: 'Token Details' },
    { id: 'trading', title: 'Trading' },
    { id: 'accounts', title: 'Accounts' },
    { id: 'errors', title: 'Error Codes' }
  ];

  const handleTryApi = async (apiPath) => {
    setIsLoading(true);
    setIsModalOpen(true);
    setApiResponse(null);

    try {
      const response = await axios.get(`https://api.xrpl.to${apiPath}`);
      setApiResponse(response.data);
    } catch (error) {
      setApiResponse({
        error: 'Failed to fetch data',
        message: error.message,
        status: error.response?.status || 'Network Error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    navigator.clipboard
      .writeText(JSON.stringify(apiResponse, null, 2))
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => console.error('Failed to copy:', err));
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <div>
            <h2 className="text-2xl font-normal mb-6 text-primary">
              XRPL.to API Documentation
            </h2>
            <p className="text-[15px] mb-6">
              Welcome to the XRPL.to API! Access comprehensive XRP Ledger token data, market
              analytics, and trading information.
            </p>

            <div className={cn(
              "rounded-xl border-[1.5px] p-6 mb-6",
              isDark ? "border-white/10 bg-primary/5" : "border-gray-200 bg-primary/5"
            )}>
              <h3 className="text-lg font-normal mb-4">Base URL</h3>
              <div className={cn(
                "p-4 rounded-lg",
                isDark ? "bg-black/30" : "bg-gray-100"
              )}>
                <code className="text-[13px]">https://api.xrpl.to</code>
              </div>
            </div>

            <div className={cn(
              "rounded-xl border-[1.5px] p-6 mb-6",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <h3 className="text-lg font-normal mb-4">Quick Start</h3>
              <p className="text-[13px] mb-3">Get trending tokens:</p>
              <div className={cn(
                "p-4 rounded-lg",
                isDark ? "bg-black/30" : "bg-gray-100"
              )}>
                <code className="text-[13px]">
                  curl -X GET "https://api.xrpl.to/api/tokens?limit=10&sortBy=vol24hxrp&sortType=desc"
                </code>
              </div>
            </div>

            <div className={cn(
              "rounded-xl border-[1.5px] p-6",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <h3 className="text-lg font-normal mb-4">Rate Limits</h3>
              <ul className="space-y-2">
                <li className="text-[13px]">Free: 1,000 requests/hour</li>
                <li className="text-[13px]">Authenticated: 5,000 requests/hour</li>
              </ul>
            </div>
          </div>
        );

      case 'tokens':
        return (
          <div>
            <h2 className="text-2xl font-normal mb-6 text-primary">Tokens</h2>

            <div className={cn(
              "rounded-xl border-[1.5px] p-6 mb-6",
              isDark ? "border-white/10 bg-primary/5" : "border-gray-200 bg-primary/5"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 text-xs font-medium rounded bg-primary text-white">GET</span>
                <code className="text-lg font-mono">/api/tokens</code>
              </div>
              <p className="text-[13px] mb-4">Get paginated list of tokens with sorting and filtering</p>

              <p className="text-[13px] font-medium mb-2">Parameters</p>
              <div className={cn(
                "rounded-lg overflow-hidden border-[1.5px]",
                isDark ? "border-white/10" : "border-gray-200"
              )}>
                <table className="w-full text-[13px]">
                  <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Name</th>
                      <th className="text-left px-4 py-2 font-medium">Type</th>
                      <th className="text-left px-4 py-2 font-medium">Default</th>
                      <th className="text-left px-4 py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-2"><code>limit</code></td>
                      <td className="px-4 py-2">number</td>
                      <td className="px-4 py-2">20</td>
                      <td className="px-4 py-2">Results per page (1-100)</td>
                    </tr>
                    <tr className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-2"><code>sortBy</code></td>
                      <td className="px-4 py-2">string</td>
                      <td className="px-4 py-2">vol24hxrp</td>
                      <td className="px-4 py-2">Sort field</td>
                    </tr>
                    <tr className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-2"><code>filter</code></td>
                      <td className="px-4 py-2">string</td>
                      <td className="px-4 py-2">-</td>
                      <td className="px-4 py-2">Search filter</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[13px] font-medium mb-2 mt-4">Example</p>
              <div className={cn("p-4 rounded-lg", isDark ? "bg-black/30" : "bg-gray-100")}>
                <code className="text-[13px]">GET https://api.xrpl.to/api/tokens?limit=10&sortBy=vol24hxrp&sortType=desc</code>
              </div>

              <button
                onClick={() => handleTryApi('/api/tokens?limit=10')}
                className={cn(
                  "mt-4 flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal",
                  isDark ? "border-white/15 hover:border-primary hover:bg-primary/5" : "border-gray-300 hover:bg-gray-100"
                )}
              >
                <Code size={14} />
                Try It Now
              </button>
            </div>

            <div className={cn(
              "rounded-xl border-[1.5px] p-6 mb-6",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 text-xs font-medium rounded bg-primary text-white">GET</span>
                <code className="text-lg font-mono">/api/trending</code>
              </div>
              <p className="text-[13px] mb-4">Get trending tokens</p>
              <div className={cn("p-4 rounded-lg", isDark ? "bg-black/30" : "bg-gray-100")}>
                <code className="text-[13px]">GET https://api.xrpl.to/api/trending?limit=10</code>
              </div>
              <button
                onClick={() => handleTryApi('/api/trending?limit=10')}
                className={cn(
                  "mt-4 flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal",
                  isDark ? "border-white/15 hover:border-primary hover:bg-primary/5" : "border-gray-300 hover:bg-gray-100"
                )}
              >
                <Code size={14} />
                Try It Now
              </button>
            </div>
          </div>
        );

      case 'token-details':
        return (
          <div>
            <h2 className="text-2xl font-normal mb-6 text-primary">Token Details</h2>

            <div className={cn(
              "rounded-xl border-[1.5px] p-6 mb-6",
              isDark ? "border-white/10 bg-primary/5" : "border-gray-200 bg-primary/5"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 text-xs font-medium rounded bg-primary text-white">GET</span>
                <code className="text-lg font-mono">/api/token/{`{identifier}`}</code>
              </div>
              <p className="text-[13px] mb-4">Get detailed token information</p>
              <div className={cn("p-4 rounded-lg", isDark ? "bg-black/30" : "bg-gray-100")}>
                <code className="text-[13px]">GET https://api.xrpl.to/api/token/solo</code>
              </div>
              <button
                onClick={() => handleTryApi('/api/token/solo')}
                className={cn(
                  "mt-4 flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal",
                  isDark ? "border-white/15 hover:border-primary hover:bg-primary/5" : "border-gray-300 hover:bg-gray-100"
                )}
              >
                <Code size={14} />
                Try It Now
              </button>
            </div>
          </div>
        );

      case 'trading':
        return (
          <div>
            <h2 className="text-2xl font-normal mb-6 text-primary">Trading</h2>

            <div className={cn(
              "rounded-xl border-[1.5px] p-6 mb-6",
              isDark ? "border-white/10 bg-primary/5" : "border-gray-200 bg-primary/5"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 text-xs font-medium rounded bg-primary text-white">GET</span>
                <code className="text-lg font-mono">/api/history</code>
              </div>
              <p className="text-[13px] mb-4">Get trading history</p>
              <div className={cn("p-4 rounded-lg", isDark ? "bg-black/30" : "bg-gray-100")}>
                <code className="text-[13px]">GET https://api.xrpl.to/api/history?limit=10</code>
              </div>
              <button
                onClick={() => handleTryApi('/api/history?limit=10')}
                className={cn(
                  "mt-4 flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal",
                  isDark ? "border-white/15 hover:border-primary hover:bg-primary/5" : "border-gray-300 hover:bg-gray-100"
                )}
              >
                <Code size={14} />
                Try It Now
              </button>
            </div>
          </div>
        );

      case 'accounts':
        return (
          <div>
            <h2 className="text-2xl font-normal mb-6 text-primary">Accounts</h2>

            <div className={cn(
              "rounded-xl border-[1.5px] p-6 mb-6",
              isDark ? "border-white/10 bg-primary/5" : "border-gray-200 bg-primary/5"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 text-xs font-medium rounded bg-primary text-white">GET</span>
                <code className="text-lg font-mono">/api/account/balance/{`{address}`}</code>
              </div>
              <p className="text-[13px] mb-4">Get account balances</p>
              <div className={cn("p-4 rounded-lg", isDark ? "bg-black/30" : "bg-gray-100")}>
                <code className="text-[13px]">GET https://api.xrpl.to/api/account/balance/rAccount123...</code>
              </div>
            </div>
          </div>
        );

      case 'errors':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>
              Error Codes
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>200</TableCell>
                    <TableCell>Success</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>400</TableCell>
                    <TableCell>Bad Request</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>404</TableCell>
                    <TableCell>Not Found</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>429</TableCell>
                    <TableCell>Too Many Requests</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>500</TableCell>
                    <TableCell>Internal Server Error</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ flex: 1 }}>
      <Head>
        <title>XRPL.to API Documentation</title>
        <meta
          name="description"
          content="Complete API documentation for XRPL.to - XRP Ledger token data and analytics"
        />
      </Head>

      <Toolbar id="back-to-top-anchor" />
      <Header />

      <Box
        sx={{
          margin: 0,
          padding: 0,
          background: theme.palette.background.default,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ display: 'flex', flex: 1 }}>
          <IconButton
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            sx={{
              display: { md: 'none' },
              position: 'fixed',
              top: 8,
              right: 8,
              zIndex: 1300,
              background: theme.palette.background.paper
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{
              width: { xs: isSidebarOpen ? '250px' : '0', md: '250px' },
              transition: 'width 0.3s',
              borderRight: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.paper,
              overflowY: 'auto',
              position: { xs: 'fixed', md: 'relative' },
              height: { xs: '100vh', md: 'auto' },
              zIndex: { xs: 1200, md: 'auto' },
              display: { xs: isSidebarOpen ? 'block' : 'none', md: 'block' }
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                API Documentation
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2, mt: 1 }}
              />
              <List>
                {sections.map((section) => (
                  <ListItem
                    key={section.id}
                    button
                    selected={currentSection === section.id}
                    onClick={() => {
                      setCurrentSection(section.id);
                      setIsSidebarOpen(false);
                    }}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText primary={section.title} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ mb: 2, fontWeight: 500 }}>
                  XRPL.to API
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  RESTful API for XRP Ledger token data and analytics
                </Typography>
                <Chip
                  label="Base URL: https://api.xrpl.to"
                  sx={{ mt: 2, background: alpha(theme.palette.primary.main, 0.1) }}
                />
              </Box>

              {renderContent()}
            </Container>
          </Box>
        </Box>

        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Paper
            sx={{ width: '90%', maxWidth: '800px', maxHeight: '80vh', overflow: 'auto', p: 3 }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">API Response</Typography>
              <Box>
                {copySuccess && (
                  <Chip icon={<CheckCircleIcon />} label="Copied!" color="success" size="small" />
                )}
                <IconButton onClick={handleCopyResponse} size="small">
                  <ContentCopyIcon />
                </IconButton>
                <IconButton onClick={() => setIsModalOpen(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : apiResponse ? (
              <Box
                component="pre"
                sx={{
                  fontSize: '14px',
                  overflow: 'auto',
                  p: 2,
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
                  borderRadius: 1
                }}
              >
                {JSON.stringify(apiResponse, null, 2)}
              </Box>
            ) : null}
          </Paper>
        </Modal>
      </Box>

      <ScrollToTop />
      <Footer />
    </Box>
  );
};

export default ApiDocsPage;
