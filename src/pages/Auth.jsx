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
    password: '',
    title: '',
    monthly_target_income: '4500',
    target_savings_rate: '25'
  });

  const redirectPath = location.state?.from?.pathname || '/';

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) return;

    const res = await login(loginData.email, loginData.password);
    if (res.success) {
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(redirectPath === '/admin' ? '/' : redirectPath);
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
      navigate('/');
    }
  };

  // Password Strength helper
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (pass.length >= 12) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const passStrength = getPasswordStrength(registerData.password);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: '520px', width: '100%' }}>
        {/* Card Header */}
        <div className="bg-dark text-white p-4 text-center border-bottom border-secondary border-opacity-25">
          <div className="d-inline-flex align-items-center justify-content-center p-3 bg-primary bg-opacity-10 rounded-circle mb-3 border border-primary border-opacity-25">
            <i className="bi bi-shield-lock-fill fs-2 text-primary"></i>
          </div>
          <h3 className="fw-bold mb-1">SmartFinance PRO</h3>
          <p className="text-secondary small mb-0">
            Enterprise-Grade Secure Financial Management Portal
          </p>
          <div className="d-inline-flex align-items-center gap-2 mt-2 px-3 py-1 rounded-pill bg-success-subtle text-success small" style={{ fontSize: '11px', fontWeight: 600 }}>
            <i className="bi bi-shield-check"></i> Zero-Knowledge Financial Privacy &amp; 256-bit Hash Security
          </div>
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
                <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill fw-semibold py-2 ${activeTab === 'register' ? 'active bg-primary' : 'text-muted'}`}
                onClick={() => { setActiveTab('register'); setAuthError(null); }}
              >
                <i className="bi bi-person-plus-fill me-1"></i> Create Account
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
                    placeholder="e.g. admin or name@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label small fw-semibold text-dark">Password</label>
                  <span className="text-muted small" style={{ fontSize: '11px' }}>Bcrypt Protected</span>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-key"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-control bg-light border-start-0 border-end-0"
                    placeholder="Enter your password"
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
                className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right"></i>
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegisterSubmit}>
              <div className="alert alert-info border-0 rounded-3 py-2 px-3 small d-flex align-items-center gap-2 mb-3" style={{ fontSize: '12px' }}>
                <i className="bi bi-info-circle-fill flex-shrink-0"></i>
                <div>Create any personal account (passwords can be 4+ characters, e.g. <code>123456</code>).</div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Full Legal Name</label>
                <input
                  type="text"
                  required
                  className="form-control bg-light"
                  placeholder="e.g. Rachel Adams"
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

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Profession / Title (Optional)</label>
                <input
                  type="text"
                  className="form-control bg-light"
                  placeholder="e.g. Product Manager"
                  value={registerData.title}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-dark">Target Income ($/mo)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    className="form-control bg-light"
                    value={registerData.monthly_target_income}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, monthly_target_income: e.target.value }))}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-dark">Target Save Rate (%)</label>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    className="form-control bg-light"
                    value={registerData.target_savings_rate}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, target_savings_rate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label small fw-semibold text-dark">Password</label>
                  <span className="text-muted small" style={{ fontSize: '11px' }}>Min. 4 characters</span>
                </div>
                <div className="input-group mb-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    className="form-control bg-light border-end-0"
                    placeholder="Create your password"
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

                {/* Password Strength Bar */}
                {registerData.password && (
                  <div className="mt-2">
                    <div className="progress" style={{ height: '4px' }}>
                      <div
                        className={`progress-bar ${passStrength >= 75 ? 'bg-success' : passStrength >= 50 ? 'bg-warning' : 'bg-danger'}`}
                        role="progressbar"
                        style={{ width: `${passStrength}%` }}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: '10px' }}>
                      <span>Security Strength:</span>
                      <strong className={passStrength >= 75 ? 'text-success' : passStrength >= 50 ? 'text-warning' : 'text-danger'}>
                        {passStrength >= 75 ? 'Strong' : passStrength >= 50 ? 'Moderate' : 'Basic'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-success w-100 rounded-pill py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-check"></i>
                    <span>Create My Account &amp; Start Saving</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none small text-muted p-0"
                  onClick={() => { setActiveTab('login'); setAuthError(null); }}
                >
                  Already registered? <strong className="text-primary">Sign in here &rarr;</strong>
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card-footer bg-light border-0 py-3 text-center text-muted small" style={{ fontSize: '11px' }}>
          <i className="bi bi-lock-fill me-1 text-success"></i>
          Encrypted with bcrypt &amp; TLS 1.3 &bull; Private Zero-Knowledge Vault
        </div>
      </div>
    </div>
  );
}
