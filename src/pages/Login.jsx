import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await loginUser({
        username: formData.username.trim(),
        password: formData.password,
      });
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout" style={{
      backgroundImage: "url('/Login_bg.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      position: "relative",
      display: "flex",
      height: "100vh",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div className="mask-card" style={{
        position: "absolute",
        top: "6px",
        left: "6px",
        right: "6px",
        bottom: "6px",
        background: "linear-gradient(to right, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.3) 10%, transparent 30%), linear-gradient(to top, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.3) 10%, transparent 60%)",
        borderRadius: "16px",
        boxShadow: "inset 0 0 0 2px rgba(200, 230, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: "8%",
        zIndex: 1
      }}>
        <img
          src="/Aditya University White Logo.png"
          alt="Aditya University"
          style={{
            position: "absolute",
            top: "40px",
            left: "40px",
            height: "80px",
            zIndex: 3
          }}
        />
        <div style={{
          position: "absolute",
          bottom: "40px",
          left: "40px",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: "500",
          letterSpacing: "0.5px",
          zIndex: 3
        }}>
          Designed and developed by IT Application
        </div>
        <div className="auth-card" style={{
          zIndex: 2,
          position: "relative",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        }}>
          <div className="auth-header" style={{ color: "#333" }}>
            <h2 style={{ color: "#111" }}>Welcome Back</h2>
            <p style={{ color: "#666" }}>Sign in to continue to your dashboard</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" style={{ color: "#444" }}>Username</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                autoComplete="username"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" style={{ color: "#444" }}>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer" style={{ color: "#555" }}>
            Don't have an account? <Link to="/register" style={{ color: "#0ea5e9", fontWeight: "600" }}>Create one now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

