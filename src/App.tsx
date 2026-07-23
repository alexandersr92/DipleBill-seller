import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Router } from './router';
import { store } from './store/store';
import { Provider } from 'react-redux';
import { ThemeProvider } from './components/theme-provider';
import { LicenseExpiredOverlay } from '@modules/auth/components/LicenseExpiredOverlay';
import { OfflineManager } from '@modules/offline/OfflineManager';

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
          <OfflineManager />
          {licenseExpired.isExpired && (
            <LicenseExpiredOverlay
              message={licenseExpired.message}
              onDismiss={() => setLicenseExpired({ isExpired: false, message: '' })}
            />
          )}
          <Router />
        </HashRouter>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
