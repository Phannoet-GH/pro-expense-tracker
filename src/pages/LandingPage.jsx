import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [calcIncome, setCalcIncome] = useState(65000);
  const [calcMonthlyExpense, setCalcMonthlyExpense] = useState(3200);

  // Dynamic ROI calculation
  const annualBusinessSpend = Math.round(calcMonthlyExpense * 12 * 0.35); // 35% typical deductible business spend
  const estimatedTaxSaved = Math.round(annualBusinessSpend * 0.28); // 28% marginal tax bracket
  const hysaInterestEarned = Math.round((calcIncome * 0.20) * 0.05); // 5% APY on 20% savings

  return (
    <div className="bg-white text-dark min-vh-100 d-flex flex-column font-sans">
      {/* 1. Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-3">
        <div className="container px-lg-4">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 text-dark">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white"
              style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
            >
              <i className="bi bi-wallet2 fs-5"></i>
            </div>
            <span>SmartFinance <span className="badge bg-primary-subtle text-primary rounded-pill fs-6">PRO</span></span>
          </Link>

          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#landingNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="landingNav">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3 small fw-medium">
              <li className="nav-item">
                <a className="nav-link text-secondary" href="#features">Features</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-secondary" href="#calculator">Tax Calculator</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-secondary" href="#pricing">Pricing</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-secondary" href="#testimonials">Reviews</a>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2">
              <Link to="/auth" className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-2 fw-semibold">
                Sign In
              </Link>
              <Link to="/auth" className="btn btn-sm btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="position-relative overflow-hidden py-5 py-lg-6" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
        <div className="container px-lg-4 py-4 text-center">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-primary-subtle text-primary fw-semibold small mb-3 border border-primary-subtle shadow-xs">
            <i className="bi bi-stars"></i>
            <span>New: AI Receipt OCR &amp; Schedule C Tax Suite</span>
          </div>

          <h1 className="display-4 fw-black text-slate-900 mx-auto mb-3" style={{ maxWidth: '850px', letterSpacing: '-0.02em', fontWeight: 800 }}>
            Automate Your Finances.<br />
            <span style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed, #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Maximize Tax Write-Offs.
            </span><br />
            Grow Net Worth Fast.
          </h1>

          <p className="lead text-muted mx-auto mb-4" style={{ maxWidth: '640px', fontSize: '1.2rem' }}>
            The financial OS built for modern freelancers, solopreneurs, and ambitious professionals.
            Capture every receipt, eliminate tax season panic, and optimize cash into 5%+ high-yield accounts.
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
            <Link
              to="/auth"
              className="btn btn-primary btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg d-flex align-items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
            >
              <span>Start 14-Day Pro Trial</span>
              <i className="bi bi-arrow-right"></i>
            </Link>

            <button
              onClick={() => navigate('/auth')}
              className="btn btn-outline-dark btn-lg rounded-pill px-4 py-3 fw-semibold"
            >
              <i className="bi bi-person-check me-2"></i>Sign In
            </button>
          </div>

          <div className="d-flex flex-wrap justify-content-center align-items-center gap-4 text-muted small">
            <span><i className="bi bi-check2-circle text-success me-1"></i> No Credit Card Required</span>
            <span><i className="bi bi-check2-circle text-success me-1"></i> 100% Private &amp; Encrypted</span>
            <span><i className="bi bi-check2-circle text-success me-1"></i> Instant Setup in 60s</span>
          </div>
        </div>
      </header>

      {/* 3. Interactive ROI & Tax Write-Off Calculator */}
      <section id="calculator" className="py-5 bg-light border-top border-bottom">
        <div className="container px-lg-4">
          <div className="text-center mb-5">
            <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1 fw-bold mb-2">
              INTERACTIVE ROI CALCULATOR
            </span>
            <h2 className="fw-bold text-dark">How Much Money Will You Keep This Year?</h2>
            <p className="text-muted small mx-auto" style={{ maxWidth: '520px' }}>
              Adjust your estimated freelance income and monthly spend to see how SmartFinance PRO pays for itself in week one.
            </p>
          </div>

          <div className="card border-0 rounded-4 shadow-lg p-4 p-lg-5 mx-auto bg-white" style={{ maxWidth: '900px' }}>
            <div className="row g-4 align-items-center">
              {/* Sliders */}
              <div className="col-lg-6">
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="fw-bold small text-dark">Annual Gross Income</label>
                    <span className="badge bg-primary-subtle text-primary fw-bold fs-6">${calcIncome.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="20000"
                    max="250000"
                    step="5000"
                    value={calcIncome}
                    onChange={(e) => setCalcIncome(Number(e.target.value))}
                  />
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: '11px' }}>
                    <span>$20,000</span>
                    <span>$125,000</span>
                    <span>$250,000</span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="fw-bold small text-dark">Average Monthly Spending</label>
                    <span className="badge bg-primary-subtle text-primary fw-bold fs-6">${calcMonthlyExpense.toLocaleString()} / mo</span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="1000"
                    max="15000"
                    step="200"
                    value={calcMonthlyExpense}
                    onChange={(e) => setCalcMonthlyExpense(Number(e.target.value))}
                  />
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: '11px' }}>
                    <span>$1,000/mo</span>
                    <span>$7,500/mo</span>
                    <span>$15,000/mo</span>
                  </div>
                </div>
              </div>

              {/* Projected Returns Box */}
              <div className="col-lg-6">
                <div
                  className="rounded-4 p-4 text-white text-center position-relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                >
                  <div className="small text-warning fw-bold text-uppercase mb-1">Your Estimated Annual Recovery</div>
                  <div className="display-5 fw-bold text-success mb-3">
                    ${(estimatedTaxSaved + hysaInterestEarned).toLocaleString()}
                  </div>

                  <div className="text-start border-top border-secondary border-opacity-25 pt-3">
                    <div className="d-flex justify-content-between small mb-2 text-white-50">
                      <span>Schedule C Tax Deductions Saved:</span>
                      <strong className="text-white">${estimatedTaxSaved.toLocaleString()}</strong>
                    </div>
                    <div className="d-flex justify-content-between small mb-2 text-white-50">
                      <span>5% High-Yield Cash Interest:</span>
                      <strong className="text-white">${hysaInterestEarned.toLocaleString()}</strong>
                    </div>
                    <div className="d-flex justify-content-between small text-white-50">
                      <span>SmartFinance PRO Cost:</span>
                      <span className="text-warning">$69.00 / year</span>
                    </div>
                  </div>

                  <Link
                    to="/auth"
                    className="btn btn-warning text-dark fw-bold rounded-pill w-100 py-2 mt-4 shadow"
                  >
                    Lock In Your Tax Savings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section id="features" className="py-5 py-lg-6 bg-white">
        <div className="container px-lg-4">
          <div className="text-center mb-5">
            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fw-bold mb-2">
              ENTERPRISE-GRADE CAPABILITIES
            </span>
            <h2 className="fw-bold text-dark">Everything You Need to Master Your Money</h2>
            <p className="text-muted small mx-auto" style={{ maxWidth: '520px' }}>
              Replace 4 different spreadsheets and expensive accounting software with one integrated workspace.
            </p>
          </div>

          <div className="row g-4">
            {/* Feature 1 */}
            <div className="col-md-4">
              <div className="card h-100 border-0 rounded-4 p-4 shadow-sm bg-light">
                <div className="p-3 rounded-3 bg-primary text-white d-inline-flex mb-3 align-self-start">
                  <i className="bi bi-camera-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">AI Receipt Scanner &amp; OCR</h5>
                <p className="text-muted small mb-0">
                  Upload a photo of any receipt. Our intelligent OCR engine instantly extracts merchant, date, tax, and categorizes it with zero manual typing.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="col-md-4">
              <div className="card h-100 border-0 rounded-4 p-4 shadow-sm bg-light">
                <div className="p-3 rounded-3 bg-success text-white d-inline-flex mb-3 align-self-start">
                  <i className="bi bi-shield-check fs-4"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Schedule C Tax Write-Offs</h5>
                <p className="text-muted small mb-0">
                  Tag business expenses in one click. Software, home office, travel, and client meals are tracked for audit-ready CPA statement export.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="col-md-4">
              <div className="card h-100 border-0 rounded-4 p-4 shadow-sm bg-light">
                <div className="p-3 rounded-3 bg-warning text-dark d-inline-flex mb-3 align-self-start">
                  <i className="bi bi-pie-chart-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">50/30/20 &amp; Auto-Planner</h5>
                <p className="text-muted small mb-0">
                  Automate the proven 50/30/20 wealth formula. When one category exceeds budget, auto-compensating algorithms balance the rest without stress.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="col-md-4">
              <div className="card h-100 border-0 rounded-4 p-4 shadow-sm bg-light">
                <div className="p-3 rounded-3 bg-info text-white d-inline-flex mb-3 align-self-start">
                  <i className="bi bi-bank fs-4"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">High-Yield APY Matcher</h5>
                <p className="text-muted small mb-0">
                  Compare top-tier FDIC insured banks earning 4.5%–5.2% APY so your emergency cushion outpaces inflation automatically.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="col-md-4">
              <div className="card h-100 border-0 rounded-4 p-4 shadow-sm bg-light">
                <div className="p-3 rounded-3 bg-purple text-white d-inline-flex mb-3 align-self-start" style={{ backgroundColor: '#7c3aed' }}>
                  <i className="bi bi-file-earmark-spreadsheet-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">One-Click CPA Statements</h5>
                <p className="text-muted small mb-0">
                  Generate formatted PDF reports and CSV ledgers formatted specifically for accountants and tax preparers (TurboTax, H&amp;R Block, CPA).
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="col-md-4">
              <div className="card h-100 border-0 rounded-4 p-4 shadow-sm bg-light">
                <div className="p-3 rounded-3 bg-dark text-white d-inline-flex mb-3 align-self-start">
                  <i className="bi bi-shield-lock-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Bank-Level Security &amp; Isolation</h5>
                <p className="text-muted small mb-0">
                  Bcrypt password hashing, token-based authorization, and isolated database records keep your confidential cash data 100% private.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section id="pricing" className="py-5 py-lg-6 bg-light border-top border-bottom">
        <div className="container px-lg-4 text-center">
          <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fw-bold mb-2">
            TRANSPARENT PRICING
          </span>
          <h2 className="fw-bold text-dark mb-2">Simple Plans That Scale With You</h2>
          <p className="text-muted small mx-auto mb-5" style={{ maxWidth: '480px' }}>
            Start for free, upgrade when you need AI automation and tax write-off exports.
          </p>

          <div className="row g-4 align-items-stretch justify-content-center text-start" style={{ maxWidth: '980px', margin: '0 auto' }}>
            {/* Free */}
            <div className="col-lg-4">
              <div className="card h-100 border rounded-4 p-4 bg-white d-flex flex-column">
                <h5 className="fw-bold text-dark mb-1">Starter</h5>
                <p className="text-muted small">Essential budgeting & manual tracking.</p>
                <div className="d-flex align-items-baseline gap-1 my-3">
                  <span className="display-6 fw-bold text-dark">$0</span>
                  <span className="text-muted small">/ month</span>
                </div>
                <hr className="opacity-10 my-2" />
                <ul className="list-unstyled small d-flex flex-column gap-2 my-3 flex-grow-1">
                  <li><i className="bi bi-check2 text-success me-2"></i> Manual income & expenses</li>
                  <li><i className="bi bi-check2 text-success me-2"></i> 3 AI receipt scans / mo</li>
                  <li><i className="bi bi-check2 text-success me-2"></i> Up to 2 savings goals</li>
                  <li><i className="bi bi-check2 text-success me-2"></i> Basic monthly charts</li>
                </ul>
                <Link to="/auth" className="btn btn-outline-secondary rounded-pill w-100 py-2 fw-semibold">
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Pro (Highlighted) */}
            <div className="col-lg-4">
              <div
                className="card h-100 border-2 border-primary rounded-4 p-4 shadow-lg position-relative d-flex flex-column"
                style={{ background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)' }}
              >
                <div
                  className="position-absolute top-0 start-50 translate-middle badge rounded-pill px-3 py-1 bg-primary text-white shadow-sm"
                  style={{ fontSize: '11px', fontWeight: 700 }}
                >
                  MOST POPULAR
                </div>
                <h5 className="fw-bold text-dark mb-1">SmartFinance PRO</h5>
                <p className="text-muted small">Full automated tax &amp; receipt suite.</p>
                <div className="d-flex align-items-baseline gap-1 my-3">
                  <span className="display-6 fw-bold text-primary">$7.99</span>
                  <span className="text-muted small">/ month</span>
                </div>
                <hr className="opacity-10 my-2" />
                <ul className="list-unstyled small d-flex flex-column gap-2 my-3 flex-grow-1">
                  <li><i className="bi bi-check-circle-fill text-primary me-2"></i> <strong>Unlimited</strong> AI receipt OCR</li>
                  <li><i className="bi bi-check-circle-fill text-primary me-2"></i> <strong>Schedule C Tax Deductions</strong></li>
                  <li><i className="bi bi-check-circle-fill text-primary me-2"></i> Audit-ready CPA PDF statements</li>
                  <li><i className="bi bi-check-circle-fill text-primary me-2"></i> Unlimited savings goals</li>
                  <li><i className="bi bi-check-circle-fill text-primary me-2"></i> High-Yield bank comparisons</li>
                  <li><i className="bi bi-check-circle-fill text-primary me-2"></i> Priority cloud data backup</li>
                </ul>
                <Link
                  to="/auth"
                  className="btn btn-primary rounded-pill w-100 py-2 fw-bold shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>

            {/* Advisor */}
            <div className="col-lg-4">
              <div className="card h-100 border rounded-4 p-4 bg-white d-flex flex-column">
                <h5 className="fw-bold text-dark mb-1">Advisor Suite</h5>
                <p className="text-muted small">For financial coaches &amp; CPAs.</p>
                <div className="d-flex align-items-baseline gap-1 my-3">
                  <span className="display-6 fw-bold text-dark">$29.99</span>
                  <span className="text-muted small">/ month</span>
                </div>
                <hr className="opacity-10 my-2" />
                <ul className="list-unstyled small d-flex flex-column gap-2 my-3 flex-grow-1">
                  <li><i className="bi bi-check2 text-success me-2"></i> Everything in PRO</li>
                  <li><i className="bi bi-check2 text-success me-2"></i> Multi-client portal access</li>
                  <li><i className="bi bi-check2 text-success me-2"></i> White-label custom domain</li>
                  <li><i className="bi bi-check2 text-success me-2"></i> Direct QBO/Xero export format</li>
                  <li><i className="bi bi-check2 text-success me-2"></i> Client audit logs</li>
                </ul>
                <Link to="/auth" className="btn btn-outline-dark rounded-pill w-100 py-2 fw-semibold">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonials & Social Proof */}
      <section id="testimonials" className="py-5 bg-white">
        <div className="container px-lg-4 text-center">
          <h2 className="fw-bold text-dark mb-4">Loved by Freelancers &amp; Solopreneurs</h2>
          <div className="row g-4 text-start">
            <div className="col-md-4">
              <div className="card h-100 border-0 rounded-4 p-4 shadow-sm bg-light">
                <div className="text-warning mb-2">★★★★★</div>
                <p className="small text-muted mb-3">
                  "Saved me over $3,100 on my taxes last year! Just snapping photos of hardware, software, and coffees meant nothing slipped through the cracks."
                </p>
                <div className="d-flex align-items-center gap-2">
                  <div className="fw-bold small text-dark">Sophia Chen</div>
                  <span className="text-muted" style={{ fontSize: '11px' }}>• Senior UX Designer</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 rounded-4 p-4 shadow-sm bg-light">
                <div className="text-warning mb-2">★★★★★</div>
                <p className="small text-muted mb-3">
                  "The 50/30/20 auto-planner actually works. Whenever I overspend on dining out, it dynamically adjusts my buffer without me having to recalculate anything."
                </p>
                <div className="d-flex align-items-center gap-2">
                  <div className="fw-bold small text-dark">Marcus Brody</div>
                  <span className="text-muted" style={{ fontSize: '11px' }}>• Software Architect</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 rounded-4 p-4 shadow-sm bg-light">
                <div className="text-warning mb-2">★★★★★</div>
                <p className="small text-muted mb-3">
                  "I onboarded 8 coaching clients to the Advisor portal. Being able to see their actual savings rate and milestone progress in real-time is invaluable."
                </p>
                <div className="d-flex align-items-center gap-2">
                  <div className="fw-bold small text-dark">Marcus Sterling</div>
                  <span className="text-muted" style={{ fontSize: '11px' }}>• Wealth Strategist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="mt-auto py-4 bg-dark text-white border-top border-secondary border-opacity-25">
        <div className="container px-lg-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="small text-secondary">
            &copy; {new Date().getFullYear()} SmartFinance PRO. All rights reserved. Bank-grade 256-bit SSL encrypted.
          </div>
          <div className="d-flex gap-3 small text-secondary">
            <Link to="/auth" className="text-secondary text-decoration-none">Sign In</Link>
            <a href="#features" className="text-secondary text-decoration-none">Features</a>
            <a href="#pricing" className="text-secondary text-decoration-none">Pricing</a>
            <span className="text-secondary">Affiliate Disclosure</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
