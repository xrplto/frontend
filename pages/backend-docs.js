import dynamic from 'next/dynamic';

const BackendDocs = dynamic(() => import('../src/components/BackendDocs/backend-docs'), {
  ssr: false
});

const BackendDocsPage = () => {
  return <BackendDocs />;
};

export default BackendDocsPage;
