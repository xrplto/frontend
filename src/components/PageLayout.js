import React, { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import Wallet from 'src/components/Wallet';

const PageLayout = ({ children }) => {
  const { accountProfile, open } = useContext(AppContext);

  return (
    <div style={{ position: 'relative' }}>
      {/* Main content with padding for fixed headers */}
      <div style={{ 
        paddingTop: '100px', // Space for fixed Topbar (36px) + Header (64px)
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