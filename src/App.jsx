import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Dashboard</h1>
        {token ? (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Welcome back! You are successfully authenticated and viewing a secure page.
            </p>
            <button onClick={handleLogout} className="btn-primary" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--error)' }}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Experience our new premium platform. Please sign in to access your dashboard.
            </p>
            <div className="home-actions">
              <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', flex: 1 }}>Sign In</Link>
              <Link to="/register" className="btn-secondary" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Create Account</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}

export default App;
