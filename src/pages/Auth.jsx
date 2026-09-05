import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

export default function Auth() {
  const { login, register, authError, setAuthError, isLoading } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) return;

    const res = await login(loginData.email, loginData.password);
    if (res.success) {
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(redirectPath === '/admin' ? '/dashboard' : redirectPath);
      }
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerData.name || !registerData.email || !registerData.password) return;

    if (registerData.password.length < 4) {
      setAuthError('Password must be at least 4 characters long.');
      return;
    }

    const res = await register(registerData);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: '460px', width: '100%' }}>
        {/* Card Header */}
        <div className="p-4 text-center border-bottom bg-white">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3 text-white shadow-sm"
            style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          >
            <i className="bi bi-wallet2 fs-4"></i>
          </div>
          <h4 className="fw-bold mb-1 text-dark">SmartFinance PRO</h4>
          <p className="text-muted small mb-0">
            {activeTab === 'login' ? 'Sign in to access your dashboard' : 'Create an account to get started'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 bg-white border-bottom">
          <ul className="nav nav-pills nav-fill gap-2">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill fw-semibold py-2 ${activeTab === 'login' ? 'active bg-primary' : 'text-muted'}`}
                onClick={() => { setActiveTab('login'); setAuthError(null); }}
              >
                Sign In
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill fw-semibold py-2 ${activeTab === 'register' ? 'active bg-primary' : 'text-muted'}`}
                onClick={() => { setActiveTab('register'); setAuthError(null); }}
              >
                Create Account
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4 bg-white">
          {/* Error Message */}
          {authError && (
            <div className="alert alert-danger border-0 rounded-3 small d-flex align-items-center gap-2 mb-4">
              <i className="bi bi-exclamation-triangle-fill flex-shrink-0 fs-5"></i>
              <div>{authError}</div>
            </div>
          )}

          {activeTab === 'login' ? (
            /* ================= SIGN IN FORM ================= */
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Email or Username</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoComplete="username"
                    className="form-control bg-light border-start-0"
                    placeholder="Enter email or username"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-key"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-control bg-light border-start-0 border-end-0"
                    placeholder="Enter password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none small text-muted p-0"
                  onClick={() => { setActiveTab('register'); setAuthError(null); }}
                >
                  Don't have an account? <strong className="text-primary">Create one</strong>
                </button>
              </div>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegisterSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-control bg-light"
                  placeholder="Enter your name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-control bg-light"
                  placeholder="name@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    className="form-control bg-light border-end-0"
                    placeholder="Create a password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none small text-muted p-0"
                  onClick={() => { setActiveTab('login'); setAuthError(null); }}
                >
                  Already have an account? <strong className="text-primary">Sign in</strong>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
