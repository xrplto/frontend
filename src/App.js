// config
//import { useConfig } from './config'
// routes
import Router from './routes';
// theme
import ThemeConfig from './theme';
import GlobalStyles from './theme/globalStyles';
// components
import ScrollToTop from './components/ScrollToTop';
// react loader spinner
//import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
// ----------------------------------------------------------------------

export default function App() {
  return (
    <ThemeConfig>
      <ScrollToTop />
      <GlobalStyles />
      <Router />
    </ThemeConfig>
  );
}
