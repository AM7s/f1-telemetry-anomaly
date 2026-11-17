import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { ChartsPage } from './pages/ChartsPage';
import { InfoPage } from './pages/InfoPage';
import { ThemeProvider } from './ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* Убираем жесткий backgroundColor отсюда, так как он теперь управляется через body в CSS */}
        <div style={{ minHeight: '100vh', fontFamily: 'system-ui' }}>
          <Header />
          <Routes>
            <Route path="/" element={<ChartsPage />} />
            <Route path="/info" element={<InfoPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}