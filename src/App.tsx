import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Router } from './router';
import { store } from './store/store';
import { Provider } from 'react-redux';
import { ThemeProvider } from './components/theme-provider';
import { LicenseExpiredOverlay } from '@modules/auth/components/LicenseExpiredOverlay';
import { useOfflineSyncManager } from './components/hooks/useOfflineSyncManager';

function SyncManagerDaemon() {
  useOfflineSyncManager();
  return null;
}

function App() {
  const [licenseExpired, setLicenseExpired] = useState({ isExpired: false, message: '' });

  useEffect(() => {
    const handleLicenseExpired = (e: Event) => {
      const customEvent = e as CustomEvent;
      setLicenseExpired({
        isExpired: true,
        message: customEvent.detail?.message,
      });
    };

    window.addEventListener('LICENSE_EXPIRED', handleLicenseExpired);
    return () => {
      window.removeEventListener('LICENSE_EXPIRED', handleLicenseExpired);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Provider store={store}>
        <HashRouter>
          {licenseExpired.isExpired && <LicenseExpiredOverlay message={licenseExpired.message} />}
          <SyncManagerDaemon />
          <Router />
        </HashRouter>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
