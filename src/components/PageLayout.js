import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from 'src/AppContext';
import Wallet from 'src/components/Wallet';

const PageLayout = ({ children }) => {
  const { accountProfile, open } = useContext(AppContext);
  const router = useRouter();
  
  // Check if we're on the API docs page
  const isApiDocsPage = router.pathname === '/api-docs';

  return (
    <div style={{ position: 'relative' }}>
      {/* Main content with padding for fixed headers */}
      <div style={{ 
        paddingTop: isApiDocsPage ? '0' : '100px', // No padding for API docs page
        marginRight: accountProfile && open ? '350px' : '0',
        transition: 'margin-right 0.3s ease'
      }}>
        {children}
      </div>
      
      {/* Embedded wallet panel - positioned below header */}
      {accountProfile && open && (
        <div style={{
          position: 'fixed',
          top: '100px', // Below Topbar (36px) + Header (64px)
          right: '0',
          width: '350px',
          height: 'calc(100vh - 100px)',
          zIndex: 1000
        }}>
          <Wallet embedded={true} />
        </div>
      )}
    </div>
  );
};

export default PageLayout;