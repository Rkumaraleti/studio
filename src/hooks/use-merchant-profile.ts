// src/hooks/use-merchant-profile.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { MerchantProfile } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const defaultProfileData: Omit<MerchantProfile, 'id'> = {
  restaurantName: "My Awesome Restaurant",
  currency: "USD",
  paymentGatewayConfigured: false,
  paymentGatewayAccountId: "", // Renamed from stripeAccountId
};

export function useMerchantProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoadingProfile(true);
      return;
    }

    if (!user) {
      setProfile(null);
      setMerchantId(null);
      setIsLoadingProfile(false);
      return;
    }

    setMerchantId(user.uid);
    setIsLoadingProfile(true);
    const profileDocRef = doc(db, 'merchants', user.uid);

    const unsubscribe = onSnapshot(profileDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() } as MerchantProfile);
      } else {
        // Profile doesn't exist, create a default one
        const newProfile: MerchantProfile = {
          id: user.uid,
          ...defaultProfileData,
        };
        try {
          await setDoc(profileDocRef, newProfile);
          setProfile(newProfile);
        } catch (error) {
          console.error("Error creating default merchant profile:", error);
          // Handle error, maybe set profile to null or a local default
        }
      }
      setIsLoadingProfile(false);
    }, (error) => {
      console.error("Error fetching merchant profile:", error);
      setIsLoadingProfile(false);
      // Potentially set an error state here
    });

    return () => unsubscribe(); // Cleanup snapshot listener

  }, [user, authLoading]);

  const updateProfile = useCallback(async (updatedProfileData: Partial<Omit<MerchantProfile, 'id'>>) => {
    if (!user) {
      console.error("User not authenticated, cannot update profile.");
      return; // Or throw an error / show toast
    }
    
    const profileDocRef = doc(db, 'merchants', user.uid);
    try {
      // We use setDoc with merge:true to only update provided fields or create if not exists
      await setDoc(profileDocRef, updatedProfileData, { merge: true });
      // Profile state will be updated by the onSnapshot listener
    } catch (error) {
      console.error("Error updating merchant profile:", error);
      // Handle error (e.g., show toast to user)
    }
  }, [user]);

  return {
    profile,
    isLoadingProfile: isLoadingProfile || authLoading,
    updateProfile,
    merchantId, // This is user.uid when authenticated
  };
}
