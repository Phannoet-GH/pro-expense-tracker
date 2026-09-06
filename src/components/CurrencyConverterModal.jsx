import React, { useState, useContext } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import {
  CURRENCY_METADATA,
  SUPPORTED_CURRENCIES,
  convertCurrency
} from '../utils/currency';

export default function CurrencyConverterModal({ isOpen, onClose }) {
  const {
    currency: activeCurrency,
    exchangeRates,
    ratesStatus,
    refreshExchangeRates,
    customKhrRate
  } = useContext(ExpenseContext);

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState(activeCurrency === 'USD' ? 'KHR' : activeCurrency);
  const [amount, setAmount] = useState('100');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const converted = convertCurrency(numAmount, fromCurrency, toCurrency, exchangeRates, customKhrRate);

  const toMeta = CURRENCY_METADATA[toCurrency] || CURRENCY_METADATA.USD;
  const fromMeta = CURRENCY_METADATA[fromCurrency] || CURRENCY_METADATA.USD;

  const formattedResult = converted.toLocaleString('en-US', {
    minimumFractionDigits: toMeta.decimals,
    maximumFractionDigits: toMeta.decimals
  });

  const singleRate = convertCurrency(1, fromCurrency, toCurrency, exchangeRates, customKhrRate);
  const formattedSingleRate = singleRate.toLocaleString('en-US', {
    minimumFractionDigits: toMeta.decimals > 0 ? toMeta.decimals : 2,
    maximumFractionDigits: 4
  });

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${toMeta.symbol}${formattedResult}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshExchangeRates();
    setIsRefreshing(false);
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
        <div
          className="modal-content rounded-4 border-0 shadow-lg p-3"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
        >
          {/* Header */}
          <div className="modal-header border-0 pb-1 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3 bg-primary-subtle text-primary fs-5">
                <i className="bi bi-currency-exchange"></i>
              </span>
              <div>
                <h5 className="modal-title fw-bold m-0" style={{ color: 'var(--text-primary)' }}>
                  Currency Exchange Converter
                </h5>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  Real-time multi-currency calculator with live market parity
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body py-3">
            {/* Live rate timestamp bar */}
            <div
              className="d-flex justify-content-between align-items-center p-2 mb-3 rounded-3"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', fontSize: '11px' }}
            >
              <div className="d-flex align-items-center gap-2 text-muted">
                <span
                  className="rounded-circle d-inline-block"
                  style={{ width: '8px', height: '8px', backgroundColor: '#10b981' }}
                ></span>
                <span>
                  Rates:{' '}
                  <strong>
                    {ratesStatus?.source === 'online'
                      ? 'Live Network'
                      : ratesStatus?.source === 'cache'
                      ? 'Local Cache'
                      : 'Benchmark'}
                  </strong>
                  {ratesStatus?.lastUpdated && (
                    <span className="ms-1">
                      ({new Date(ratesStatus.lastUpdated).toLocaleDateString()})
                    </span>
                  )}
                </span>
              </div>
              <button
                className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold text-primary d-flex align-items-center gap-1"
                onClick={handleRefresh}
                disabled={isRefreshing}
                style={{ fontSize: '11px' }}
              >
                <i className={`bi bi-arrow-repeat ${isRefreshing ? 'spin-animation' : ''}`}></i>
                <span>{isRefreshing ? 'Syncing...' : 'Update Rates'}</span>
              </button>
            </div>

            {/* From Currency Block */}
            <div
              className="p-3 rounded-4 mb-2"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}
            >
              <label className="text-muted small fw-semibold mb-1 d-block">You Send / From</label>
              <div className="d-flex gap-2">
                <input
                  type="number"
                  className="form-control form-control-lg fw-bold border-0 bg-transparent p-0 fs-3"
                  style={{ color: 'var(--text-primary)', boxShadow: 'none' }}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                />
                <select
                  className="form-select border-0 shadow-sm fw-bold rounded-pill px-3"
                  style={{
                    width: '160px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                >
                  {SUPPORTED_CURRENCIES.map((code) => {
                    const c = CURRENCY_METADATA[code];
                    return (
                      <option key={code} value={code}>
                        {c.flag} {c.code} ({c.symbol})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Swap Button Divider */}
            <div className="d-flex justify-content-center my-n2 position-relative" style={{ zIndex: 2 }}>
              <button
                type="button"
                className="btn btn-primary rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px' }}
                onClick={handleSwap}
                title="Swap currencies"
              >
                <i className="bi bi-arrow-down-up fs-6"></i>
              </button>
            </div>

            {/* To Currency Block */}
            <div
              className="p-3 rounded-4 mt-n2 mb-3"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}
            >
              <label className="text-muted small fw-semibold mb-1 d-block">Converted Equivalent / To</label>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <div className="fw-bold fs-3 text-success text-truncate">
                  {toMeta.symbol} {formattedResult}
                </div>
                <select
                  className="form-select border-0 shadow-sm fw-bold rounded-pill px-3"
                  style={{
                    width: '160px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                >
                  {SUPPORTED_CURRENCIES.map((code) => {
                    const c = CURRENCY_METADATA[code];
                    return (
                      <option key={code} value={code}>
                        {c.flag} {c.code} ({c.symbol})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Exchange Rate Badge Formula */}
            <div className="d-flex justify-content-between align-items-center px-1 mb-3">
              <div className="text-muted small">
                Exchange Parity:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  1 {fromCurrency} = {toMeta.symbol}
                  {formattedSingleRate} {toCurrency}
                </strong>
              </div>
              <button
                className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'} rounded-pill px-3`}
                style={{ fontSize: '11px' }}
                onClick={handleCopy}
              >
                <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'} me-1`}></i>
                {copied ? 'Copied!' : 'Copy Result'}
              </button>
            </div>

            {/* Quick preset amounts */}
            <div className="d-flex align-items-center gap-1 flex-wrap">
              <span className="text-muted me-1" style={{ fontSize: '11px' }}>Quick:</span>
              {['10', '50', '100', '500', '1000'].map((p) => (
                <button
                  key={p}
                  type="button"
                  className="btn btn-sm btn-light rounded-pill py-0 px-2 text-muted fw-semibold"
                  style={{ fontSize: '11px', border: '1px solid var(--border-color)' }}
                  onClick={() => setAmount(p)}
                >
                  {fromMeta.symbol}{p}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4 fw-semibold w-100 shadow-sm"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
