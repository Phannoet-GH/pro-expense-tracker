import React, { useState } from 'react';

export default function ShareModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://smartfinance-pro.onrender.com';
  const shareTitle = 'SmartFinance PRO — AI Expense Tracker & Tax Intelligence';
  const shareText = 'Track your daily expenses, scan receipts with AI, automate CPA tax deductions, and budget with dual USD/KHR currencies on SmartFinance PRO! 🚀';

  const handleCopy = () => {
    navigator.clipboard.writeText(`${currentUrl}?ref=share`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareChannels = [
    {
      name: 'Telegram',
      icon: 'bi-telegram',
      color: '#0088cc',
      bg: '#e0f2fe',
      url: `https://t.me/share/url?url=${encodeURIComponent(currentUrl + '?ref=tg')}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'WhatsApp',
      icon: 'bi-whatsapp',
      color: '#16a34a',
      bg: '#dcfce7',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + currentUrl + '?ref=wa')}`
    },
    {
      name: 'Facebook',
      icon: 'bi-facebook',
      color: '#1877f2',
      bg: '#dbeafe',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl + '?ref=fb')}`
    },
    {
      name: 'X (Twitter)',
      icon: 'bi-twitter-x',
      color: '#0f172a',
      bg: '#f1f5f9',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl + '?ref=x')}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'LinkedIn',
      icon: 'bi-linkedin',
      color: '#0a66c2',
      bg: '#e0f2fe',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl + '?ref=li')}`
    }
  ];

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 1070 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden animate-fade-in">
          {/* Header Banner */}
          <div
            className="p-4 text-white position-relative"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          >
            <button
              type="button"
              className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
              onClick={onClose}
              aria-label="Close"
            ></button>

            <div className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill bg-white bg-opacity-20 text-white small fw-bold mb-2">
              <i className="bi bi-rocket-takeoff-fill"></i>
              <span>Boost &amp; Spread the Word</span>
            </div>
            <h4 className="fw-black mb-1">Share SmartFinance PRO</h4>
            <p className="small mb-0 text-white-50">
              Help friends, freelancers, and businesses eliminate budgeting stress and save on taxes!
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-4 bg-white">
            {/* Quick Share Grid */}
            <div className="text-muted small fw-bold text-uppercase mb-3" style={{ fontSize: '11px' }}>
              Share directly to your network
            </div>

            <div className="row g-2 mb-4">
              {shareChannels.map(ch => (
                <div key={ch.name} className="col-4 col-sm-4">
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn w-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-3 text-decoration-none border transition-all hover-lift"
                    style={{ backgroundColor: ch.bg, borderColor: `${ch.color}20` }}
                  >
                    <i className={`bi ${ch.icon} fs-3`} style={{ color: ch.color }}></i>
                    <span className="small fw-semibold mt-1" style={{ color: ch.color, fontSize: '12px' }}>
                      {ch.name}
                    </span>
                  </a>
                </div>
              ))}

              <div className="col-4 col-sm-4">
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className="btn w-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-3 text-decoration-none border bg-light text-secondary transition-all hover-lift"
                >
                  <i className="bi bi-qr-code-scan fs-3 text-dark"></i>
                  <span className="small fw-semibold mt-1 text-dark" style={{ fontSize: '12px' }}>
                    {showQr ? 'Hide QR' : 'Show QR'}
                  </span>
                </button>
              </div>
            </div>

            {/* QR Code Card if toggled */}
            {showQr && (
              <div className="p-3 bg-light rounded-3 border text-center mb-4 animate-fade-in">
                <div className="small text-muted mb-2">
                  Scan with any phone camera to open SmartFinance PRO:
                </div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl + '?ref=qr')}`}
                  alt="SmartFinance PRO QR Code"
                  className="rounded-3 shadow-xs bg-white p-2 border"
                  width="160"
                  height="160"
                />
                <div className="small text-muted mt-2 font-monospace" style={{ fontSize: '11px' }}>
                  {currentUrl}
                </div>
              </div>
            )}

            {/* Copy Link Input Group */}
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                OR COPY WEBPAGE LINK
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-link-45deg"></i>
                </span>
                <input
                  type="text"
                  readOnly
                  value={`${currentUrl}?ref=share`}
                  className="form-control bg-light font-monospace small border-start-0"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`btn ${copied ? 'btn-success' : 'btn-primary'} px-3 fw-semibold shadow-sm`}
                >
                  {copied ? (
                    <>
                      <i className="bi bi-check-lg me-1"></i> Copied!
                    </>
                  ) : (
                    <>
                      <i className="bi bi-clipboard me-1"></i> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Proof Counter */}
            <div className="p-3 rounded-3 bg-primary-subtle border border-primary-subtle d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px', flexShrink: 0 }}
              >
                <i className="bi bi-people-fill fs-6"></i>
              </div>
              <div className="small">
                <strong className="text-dark">2,480+ users tracking finances</strong>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  $140,000+ in estimated tax deductions &amp; savings identified.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
