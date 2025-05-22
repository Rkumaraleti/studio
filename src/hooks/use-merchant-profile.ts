
// src/hooks/use-merchant-profile.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { MerchantProfile } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';

// Default data for a new merchant profile, EXCLUDING id and publicMerchantId
const defaultNewProfileData: Omit<MerchantProfile, 'id' | 'publicMerchantId' | 'createdAt' | 'updatedAt'> = {
  restaurantName: "My Awesome Restaurant",
  currency: "USD",
  paymentGatewayConfigured: false,
  paymentGatewayAccountId: "",
};

// Helper to generate a unique public ID
const generatePublicMerchantId = () => {
  // Uses Firestore's internal ID generation for a portion to ensure high uniqueness
  const newIdPart = doc(collection(db, '_temp')).id; // _temp is a dummy path for ID generation
  return `m_${newIdPart.substring(0, 12)}`;
};

export function useMerchantProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [publicMerchantId, setPublicMerchantId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoadingProfile(true);
      return;
    }

    if (!user) {
      setProfile(null);
      setPublicMerchantId(null);
      setAuthUserId(null);
      setIsLoadingProfile(false);
      return;
    }

    setAuthUserId(user.uid);
    setIsLoadingProfile(true);
    const profileDocRef = doc(db, 'merchants', user.uid);

    const unsubscribe = onSnapshot(profileDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const existingData = { id: docSnap.id, ...docSnap.data() } as MerchantProfile;
        if (existingData.publicMerchantId) {
          setProfile(existingData);
          setPublicMerchantId(existingData.publicMerchantId);
        } else {
          // Migrate existing profile: add publicMerchantId if missing
          const newPublicId = generatePublicMerchantId();
          const updatedProfileWithPublicId: MerchantProfile = {
            ...existingData,
            publicMerchantId: newPublicId,
            updatedAt: serverTimestamp(),
          };
          await setDoc(profileDocRef, { publicMerchantId: newPublicId, updatedAt: serverTimestamp() }, { merge: true });
          setProfile(updatedProfileWithPublicId); // Optimistically update state
          setPublicMerchantId(newPublicId);
        }
      } else {
        // Profile doesn't exist, create a new one
        const newPublicId = generatePublicMerchantId();
        const newProfile: MerchantProfile = {
          id: user.uid,
          publicMerchantId: newPublicId,
          ...defaultNewProfileData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        try {
          await setDoc(profileDocRef, newProfile);
          setProfile(newProfile);
          setPublicMerchantId(newPublicId);
        } catch (error) {
          console.error("Error creating new merchant profile:", error);
        }
      }
      setIsLoadingProfile(false);
    }, (error) => {
      console.error("Error fetching merchant profile:", error);
      setIsLoadingProfile(false);
    });

    return () => unsubscribe();

  }, [user, authLoading]);

  const updateProfile = useCallback(async (updatedProfileData: Partial<Omit<MerchantProfile, 'id' | 'publicMerchantId' | 'createdAt'>>) => {
    if (!user) {
      console.error("User not authenticated, cannot update profile.");
      throw new Error("User not authenticated");
    }
    
    const profileDocRef = doc(db, 'merchants', user.uid);
    try {
      await setDoc(profileDocRef, { ...updatedProfileData, updatedAt: serverTimestamp() }, { merge: true });
      // Profile state will be updated by the onSnapshot listener
    } catch (error) {
      console.error("Error updating merchant profile:", error);
      throw error;
    }
  }, [user]);

  return {
    profile, // Contains all merchant data including id (uid) and publicMerchantId
    isLoadingProfile: isLoadingProfile || authLoading,
    updateProfile,
    authUserId, // This is user.uid, the document ID for the merchant's profile
    publicMerchantId, // The generated public-facing ID
  };
}
