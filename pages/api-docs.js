import dynamic from 'next/dynamic';

const ApiDocs = dynamic(() => import('../src/components/ApiDocs/api-docs'), {
  ssr: false,
});

const ApiDocsPage = () => {
  return <ApiDocs />;
};

export default ApiDocsPage;
