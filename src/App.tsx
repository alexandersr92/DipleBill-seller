import { HashRouter } from 'react-router-dom';
import { Router } from './router';
import { store } from './store/store';
import { Provider } from 'react-redux';
import { ThemeProvider } from './components/theme-provider';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Provider store={store}>
        <HashRouter>
          <Router />
        </HashRouter>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
