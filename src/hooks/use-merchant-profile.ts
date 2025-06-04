// src/hooks/use-merchant-profile.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/config";
import { customAlphabet } from "nanoid";
import { useAuth } from "@/contexts/auth-context";

const generatePublicMerchantId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

async function ensureMerchantProfile(user: any) {
  // 1. Try to fetch the profile
  let { data: profile, error } = await supabase
    .from("merchant_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 2. If not found, create it ONCE
  if (!profile) {
    const public_merchant_id = generatePublicMerchantId();
    const { data: newProfile, error: insertError } = await supabase
      .from("merchant_profiles")
      .insert([
        {
          user_id: user.id,
          restaurant_name: user.email ? user.email.split("@")[0] : "My Restaurant",
          public_merchant_id,
          currency: "INR"
        }
      ])
      .select()
      .single();
    if (insertError) throw insertError;
    profile = newProfile;
  }
  return profile;
}

export function useMerchantProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrCreateProfile() {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      try {
        const profile = await ensureMerchantProfile(user);
        setProfile(profile);
      } catch (err: any) {
        setError(err.message || "Failed to fetch or create profile");
        setProfile(null);
      }
      setLoading(false);
    }
    fetchOrCreateProfile();
  }, []);

  const createProfile = useCallback(async (restaurantName: string) => {
    if (!user) throw new Error("Not authenticated");
    setLoading(true);
    setError(null);
    try {
      // Only create if not exists
      let { data: profile } = await supabase
        .from("merchant_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (!profile) {
        const public_merchant_id = generatePublicMerchantId();
        const { data, error } = await supabase
          .from("merchant_profiles")
          .insert([{
            user_id: user.id,
            restaurant_name: restaurantName,
            public_merchant_id,
            currency: "INR"
          }])
          .select()
          .single();
        if (error) throw error;
        setProfile(data);
        return data;
      } else {
        setProfile(profile);
        return profile;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: any) => {
    if (!user) throw new Error("Not authenticated");
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error("No updates provided");
    }

    setLoading(true);
    setError(null);
    try {
      // Transform camelCase to snake_case for database
      const transformedUpdates = {
        ...(updates.restaurantName && { restaurant_name: updates.restaurantName }),
        ...(updates.restaurantDescription && { description: updates.restaurantDescription }),
        ...(updates.currency && { currency: updates.currency }),
        ...(updates.paymentGatewayConfigured !== undefined && { 
          payment_gateway_configured: updates.paymentGatewayConfigured 
        }),
        ...(updates.paymentGatewayAccountId && { 
          payment_gateway_account_id: updates.paymentGatewayAccountId 
        })
      };

      const { data, error } = await supabase
        .from("merchant_profiles")
        .update(transformedUpdates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Update the local state with the new data
      setProfile(prevProfile => ({
        ...prevProfile,
        ...transformedUpdates
      }));

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Generate the public menu URL on the fly
  const publicMenuUrl = profile?.public_merchant_id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${profile.public_merchant_id}`
    : null;

  return {
    profile,
    loading: loading || authLoading,
    error,
    fetchProfile: ensureMerchantProfile,
    createProfile,
    updateProfile,
    publicMerchantId: profile?.public_merchant_id,
    publicMenuUrl
  };
}
