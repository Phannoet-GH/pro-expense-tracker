import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from './UserContext';
import { apiFetch, parseResponse } from '../utils/api';

export const BillingContext = createContext();

export function BillingProvider({ children }) {
  const { token, currentUser } = useContext(UserContext) || {};

  const [billingData, setBillingData] = useState({
    tier: 'free',
    status: 'active',
    scansUsed: 0,
    scansLimit: 3,
    scansRemaining: 3,
    canScan: true,
    currentPeriodEnd: null
  });
  const [plans, setPlans] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [upgradeTriggerReason, setUpgradeTriggerReason] = useState('');

  // Fetch billing details from server
  const fetchBillingStatus = useCallback(async () => {
    if (!token) {
      setBillingData({
        tier: 'free',
        status: 'active',
        scansUsed: 0,
        scansLimit: 3,
        scansRemaining: 3,
        canScan: true,
        currentPeriodEnd: null
      });
      return;
    }

    try {
      const res = await apiFetch('/api/billing/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok && data?.success) {
        setBillingData({
          tier: data.tier || 'free',
          status: data.status || 'active',
          scansUsed: data.scansUsed || 0,
          scansLimit: data.scansLimit || 3,
          scansRemaining: data.scansRemaining ?? 3,
          canScan: data.canScan ?? true,
          currentPeriodEnd: data.currentPeriodEnd
        });
      }
    } catch (err) {
      console.warn('Could not fetch billing status:', err.message);
    }
  }, [token]);

  // Fetch public plans
  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await apiFetch('/api/billing/plans');
        const { ok, data } = await parseResponse(res);
        if (ok && data?.plans) {
          setPlans(data.plans);
        }
      } catch (err) {
        console.warn('Could not load pricing plans:', err.message);
      }
    }
    loadPlans();
  }, []);

  useEffect(() => {
    fetchBillingStatus();
  }, [fetchBillingStatus, currentUser]);

  const openPricingModal = (reason = '') => {
    setUpgradeTriggerReason(reason);
    setIsPricingModalOpen(true);
  };

  const closePricingModal = () => {
    setIsPricingModalOpen(false);
    setUpgradeTriggerReason('');
  };

  // Instant test upgrade toggle (works seamlessly without Stripe keys)
  const upgradePlan = async (targetTier = 'pro') => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/billing/upgrade-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan_tier: targetTier })
      });

      const { ok, data } = await parseResponse(res);
      if (!ok) throw new Error(data?.error || 'Upgrade failed');

      // Refresh billing data and current user
      await fetchBillingStatus();
      closePricingModal();
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const effectiveTier = currentUser?.role === 'admin' ? 'enterprise' : (billingData.tier || 'free');
  const isPro = effectiveTier === 'pro' || effectiveTier === 'enterprise' || currentUser?.role === 'admin';
  const isEnterprise = effectiveTier === 'enterprise' || currentUser?.role === 'admin';

  return (
    <BillingContext.Provider
      value={{
        billingData,
        tier: effectiveTier,
        isPro,
        isEnterprise,
        plans,
        isLoading,
        isPricingModalOpen,
        upgradeTriggerReason,
        openPricingModal,
        closePricingModal,
        upgradePlan,
        refreshBilling: fetchBillingStatus
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export const useBilling = () => useContext(BillingContext);
