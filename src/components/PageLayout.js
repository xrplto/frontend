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
    <div>
      {/* Main content with padding for fixed headers */}
      <div style={{ 
        paddingTop: isApiDocsPage ? '0' : '56px', // Slightly more padding to move content down
        marginRight: accountProfile && open ? '350px' : '0',
        transition: 'margin-right 0.3s ease'
      }}>
        {children}
      </div>
      
      {/* Embedded wallet panel - positioned below header */}
      {accountProfile && open && (
        <div style={{
          position: 'fixed',
          top: '56px', // Below Header with spacing
          right: '0',
          width: '350px',
          height: 'calc(100vh - 48px)',
          zIndex: 1000
        }}>
          <Wallet embedded={true} />
        </div>
      )}
    </div>
  );
};

export default PageLayout;