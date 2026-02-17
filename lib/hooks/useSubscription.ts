"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

export function useSubscription() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/subscription/current");
      setSubscription(res.data.subscription);
    } catch (err) {
      console.error("Failed to load subscription", err);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    refresh: fetchSubscription,
  };
}
