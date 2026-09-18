import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Adjust these values to control the background image properties
  const bgImageWidth = "100%"; // Change this for width (e.g., "100vw", "120%", "cover")
  const bgImageHeight = "100vh"; // Change this for height (e.g., "100vh", "auto")
  const bgSaturation = "100%"; // Change this to control color saturation (e.g., "50%", "0%" for grayscale, "200%")
  const bgOpacity = "0.6"; // Change this to control image opacity (e.g., "0.8", "0.5")

  return (
    <div className="auth-layout" style={{
      position: "relative",
      display: "flex",
      height: "100vh",
      width: "100vw",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: "#f0f2f5" // Fallback background color if opacity is reduced
    }}>
      {/* Background Image Layer */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: "url('/Login_bg.png')",
        backgroundSize: `${bgImageWidth} ${bgImageHeight}`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: `saturate(${bgSaturation})`,
        opacity: bgOpacity,
        zIndex: 0
      }} />

      <div className="mask-card" style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: "8%",
        zIndex: 1
      }}>
        <img
          src="/AEI_logoo.png"
          alt="Aditya Educational Institutions"
          style={{
            position: "absolute",
            top: "20px",
            left: "40px",
            height: "55px",
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
          Designed and developed by IT Applications
        </div>
        <div className="auth-card" style={{
          zIndex: 2,
          position: "relative",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        }}>
          <div className="auth-header" style={{ color: "#333" }}>
            <h2 style={{ color: "#111", fontWeight: "800" }}>Login</h2>
            <p style={{ color: "#666" }}>Sign in to continue to your dashboard</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginTop: "24px" }}>
              <div style={{ position: "relative" }}>
                <label htmlFor="username" style={{ position: "absolute", top: "-10px", left: "12px", backgroundColor: "#ffffff", padding: "0 6px", fontSize: "12px", color: "#666", zIndex: 1 }}>Username</label>
                <User size={18} color="#666" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="form-input"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #9ca3af",
                    padding: "14px 14px 14px 42px",
                    color: "#333",
                    borderRadius: "6px",
                    width: "100%",
                    outline: "none"
                  }}
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "24px" }}>
              <div style={{ position: "relative" }}>
                <label htmlFor="password" style={{ position: "absolute", top: "-10px", left: "12px", backgroundColor: "#ffffff", padding: "0 6px", fontSize: "12px", color: "#666", zIndex: 1 }}>Password</label>
                <Lock size={18} color="#666" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="form-input"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #9ca3af",
                    padding: "14px 42px 14px 42px",
                    color: "#333",
                    borderRadius: "6px",
                    width: "100%",
                    outline: "none"
                  }}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  {showPassword ? <EyeOff size={18} color="#666" /> : <Eye size={18} color="#666" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

