import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

export function Header() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const navStyle = (path: string) => ({
    padding: '12px 24px',
    textDecoration: 'none',
    color: location.pathname === path ? 'var(--text-main)' : 'var(--text-muted)',
    borderBottom: location.pathname === path ? '3px solid var(--accent-red)' : '3px solid transparent',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    transition: 'all 0.2s',
  });

  return (
    <header style={{ 
      backgroundColor: isDark ? '#000' : '#fff', 
      display: 'flex', 
      alignItems: 'center', 
      borderBottom: '1px solid var(--border-color)',
      transition: 'background-color 0.3s'
    }}>
      <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center' }}>
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg" 
          alt="F1" 
          className="f1-logo" 
        />
        <span style={{ fontSize: '1.2rem', fontWeight: 700, fontStyle: 'italic', letterSpacing: '1px', color: isDark ? '#fff' : '#000' }}>
          TELEMETRY EXPLORER
        </span>
      </div>
      
      <nav style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center' }}>
        <Link to="/" style={navStyle('/')}>Графики</Link>
        <Link to="/info" style={navStyle('/info')}>Результаты сессий</Link>
        
        {/* Кнопка переключения темы */}
        <button 
          onClick={toggleTheme} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-main)', 
            fontSize: '1.5rem', 
            cursor: 'pointer',
            padding: '0 24px'
          }}
          title="Переключить тему"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </nav>
    </header>
  );
}