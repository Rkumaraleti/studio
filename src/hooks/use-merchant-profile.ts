
// src/hooks/use-merchant-profile.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { MerchantProfile } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, onSnapshot, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from './use-toast';

// Default data for a new merchant profile, EXCLUDING id, publicMerchantId, staticMenuUrl, createdAt, updatedAt
const defaultNewProfileData: Omit<MerchantProfile, 'id' | 'publicMerchantId' | 'staticMenuUrl' | 'createdAt' | 'updatedAt'> = {
  restaurantName: "My Awesome Restaurant",
  restaurantDescription: "Serving the best food in town!",
  currency: "USD",
  paymentGatewayConfigured: false,
  paymentGatewayAccountId: "",
};

// Helper to generate a unique public ID
const generatePublicMerchantId = () => {
  const newIdPart = doc(collection(db, '_temp')).id;
  return `m_${newIdPart.substring(0, 12)}`;
};

export function useMerchantProfile() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
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
        let existingData = { id: docSnap.id, ...docSnap.data() } as MerchantProfile;
        let updatesToApply: Partial<MerchantProfile> = {};
        let profileNeedsUpdateInDb = false;

        if (!existingData.publicMerchantId) {
          existingData.publicMerchantId = generatePublicMerchantId();
          updatesToApply.publicMerchantId = existingData.publicMerchantId;
          profileNeedsUpdateInDb = true;
        }
        
        if (!existingData.staticMenuUrl && existingData.publicMerchantId) {
          existingData.staticMenuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${existingData.publicMerchantId}` : `/menu/${existingData.publicMerchantId}`;
          updatesToApply.staticMenuUrl = existingData.staticMenuUrl;
          profileNeedsUpdateInDb = true;
        }
        
        if (profileNeedsUpdateInDb) {
          updatesToApply.updatedAt = serverTimestamp();
          await updateDoc(profileDocRef, updatesToApply);
          // Data will be re-fetched by onSnapshot, so we use existingData as it will be updated
        }
        setProfile(existingData);
        setPublicMerchantId(existingData.publicMerchantId);

      } else {
        // Profile doesn't exist, create a new one
        const newPublicId = generatePublicMerchantId();
        const newStaticMenuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${newPublicId}` : `/menu/${newPublicId}`;
        
        const newProfile: MerchantProfile = {
          id: user.uid,
          publicMerchantId: newPublicId,
          staticMenuUrl: newStaticMenuUrl,
          ...defaultNewProfileData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        try {
          await setDoc(profileDocRef, newProfile);
          setProfile(newProfile); // onSnapshot will subsequently update this
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

  const updateProfile = useCallback(async (updatedProfileData: Partial<Omit<MerchantProfile, 'id' | 'publicMerchantId' | 'staticMenuUrl' | 'createdAt'>>) => {
    if (!user) {
      console.error("User not authenticated, cannot update profile.");
      throw new Error("User not authenticated");
    }
    
    const profileDocRef = doc(db, 'merchants', user.uid);
    try {
      await updateDoc(profileDocRef, { ...updatedProfileData, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("Error updating merchant profile:", error);
      throw error;
    }
  }, [user]);

  const regenerateAndSaveStaticMenuUrl = useCallback(async () => {
    if (!user || !publicMerchantId) {
      toast({ title: "Error", description: "User or profile ID missing.", variant: "destructive" });
      return;
    }
    const newStaticMenuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${publicMerchantId}` : `/menu/${publicMerchantId}`; // Fallback in case window is somehow not available
    try {
      const profileDocRef = doc(db, 'merchants', user.uid);
      await updateDoc(profileDocRef, { staticMenuUrl: newStaticMenuUrl, updatedAt: serverTimestamp() });
      // The onSnapshot listener will update the local 'profile' state, including staticMenuUrl
      toast({ title: "Menu URL Updated", description: "The QR code will now reflect the new URL." });
    } catch (error) {
      console.error("Error regenerating static menu URL:", error);
      toast({ title: "Update Failed", description: "Could not update the menu URL.", variant: "destructive" });
    }
  }, [user, publicMerchantId, toast]);

  return {
    profile,
    isLoadingProfile: isLoadingProfile || authLoading,
    updateProfile,
    authUserId,
    publicMerchantId,
    regenerateAndSaveStaticMenuUrl, // Expose new function
  };
}
