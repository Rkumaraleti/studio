// src/hooks/use-merchant-profile.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { MerchantProfile } from '@/lib/types';

const PROFILE_STORAGE_KEY = 'qrPlusMerchantProfile';

// Function to generate a simple unique ID
const generateUniqueId = (): string => {
  return `merchant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const defaultProfile: Omit<MerchantProfile, 'id'> = {
  restaurantName: "My Restaurant",
  currency: "USD",
  paymentGatewayConfigured: false,
  stripeAccountId: "",
};

export function useMerchantProfile() {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        } else {
          // Initialize with a new ID and default values
          const newProfile: MerchantProfile = {
            id: generateUniqueId(),
            ...defaultProfile,
          };
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
          setProfile(newProfile);
        }
      } catch (error) {
        console.error("Failed to load merchant profile from localStorage:", error);
        // Fallback to new profile if parsing fails
        const newProfile: MerchantProfile = {
            id: generateUniqueId(),
            ...defaultProfile,
          };
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile)); // Attempt to save a valid new profile
        setProfile(newProfile);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const updateProfile = useCallback((updatedProfileData: Partial<Omit<MerchantProfile, 'id'>>) => {
    setProfile((currentProfile) => {
      if (!currentProfile) return null; // Should not happen if initialized correctly
      const newProfile = { ...currentProfile, ...updatedProfileData };
      if (typeof window !== 'undefined') {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      }
      return newProfile;
    });
  }, []);
  
  // Function to explicitly get the current merchant ID, even if profile is null during initial load
  const getMerchantIdSync = (): string | null => {
    if (typeof window !== 'undefined') {
      try {
        const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          return parsed.id || null;
        }
         // If no profile, initialize one to get an ID (should ideally be covered by useEffect)
        const newProfile: MerchantProfile = {
          id: generateUniqueId(),
          ...defaultProfile,
        };
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
        return newProfile.id;

      } catch (error) {
        console.error("Error getting merchantId sync:", error);
        return null;
      }
    }
    return null;
  };


  return {
    profile,
    isLoadingProfile: isLoading,
    updateProfile,
    merchantId: profile?.id || getMerchantIdSync(), // Provide merchantId, try sync version as fallback
  };
}
