import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';

const ApiDocs = dynamic(() => import('../src/components/ApiDocs/api-docs'), {
  ssr: false,
  loading: () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <CircularProgress />
    </Box>
  ),
});

const ApiDocsPage = () => {
  return <ApiDocs />;
};

export default ApiDocsPage;
