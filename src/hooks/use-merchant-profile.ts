
// src/hooks/use-merchant-profile.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { MerchantProfile } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, onSnapshot, collection, serverTimestamp, updateDoc, deleteField } from 'firebase/firestore';
import { useToast } from './use-toast';

// Default data for a new merchant profile
const defaultNewProfileData: Omit<MerchantProfile, 'id' | 'publicMerchantId' | 'staticMenuUrl' | 'createdAt' | 'updatedAt'> = {
  restaurantName: "My Awesome Restaurant",
  restaurantDescription: "Serving the best food in town!",
  currency: "INR", // Default to INR
  paymentGatewayConfigured: false,
  paymentGatewayAccountId: "",
};

// Helper to generate a unique public ID
const generatePublicMerchantId = () => {
  const newIdPart = doc(collection(db, '_temp')).id; // Generate a new Firestore ID
  return `m_${newIdPart.substring(0, 12)}`; // Use a portion of it
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
          try {
            await updateDoc(profileDocRef, updatesToApply);
          } catch (error) {
            console.error("Error auto-updating profile with IDs/URL:", error);
          }
          // Data will be re-fetched by onSnapshot after update, or use merged for immediate UI
        }
        setProfile({...existingData, ...updatesToApply}); // Use merged for immediate UI update
        setPublicMerchantId(existingData.publicMerchantId || updatesToApply.publicMerchantId || null);

      } else {
        // Profile doesn't exist, create a new one
        const newPublicId = generatePublicMerchantId();
        const newStaticMenuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${newPublicId}` : `/menu/${newPublicId}`;
        
        const newProfileData: Omit<MerchantProfile, 'id' | 'createdAt' | 'updatedAt'> = {
          ...defaultNewProfileData, // Contains default currency INR
          publicMerchantId: newPublicId,
          staticMenuUrl: newStaticMenuUrl,
        };
        try {
          await setDoc(profileDocRef, { 
            ...newProfileData, 
            createdAt: serverTimestamp(), 
            updatedAt: serverTimestamp() 
          });
          // onSnapshot will subsequently update 'profile' state from Firestore
          // For immediate UI, we could set it here, but onSnapshot is more robust
        } catch (error) {
          console.error("Error creating new merchant profile:", error);
          toast({ title: "Profile Creation Failed", description: "Could not set up your merchant profile.", variant: "destructive" });
        }
      }
      setIsLoadingProfile(false);
    }, (error) => {
      console.error("Error fetching merchant profile:", error);
      toast({ title: "Profile Error", description: "Could not load your merchant profile.", variant: "destructive" });
      setIsLoadingProfile(false);
    });

    return () => unsubscribe();

  }, [user, authLoading, toast]);

  const updateProfile = useCallback(async (updatedProfileData: Partial<Omit<MerchantProfile, 'id' | 'publicMerchantId' | 'staticMenuUrl' | 'createdAt'>>) => {
    if (!user) {
      console.error("User not authenticated, cannot update profile.");
      throw new Error("User not authenticated");
    }
    
    const profileDocRef = doc(db, 'merchants', user.uid);
    try {
      // Ensure restaurantDescription is handled correctly (e.g., using deleteField if empty)
      const dataToUpdate = { ...updatedProfileData, updatedAt: serverTimestamp() } as any;
      if (updatedProfileData.restaurantDescription === '') {
        dataToUpdate.restaurantDescription = deleteField();
      } else if (updatedProfileData.restaurantDescription === undefined) {
        // If explicitly undefined, it might be intended to remove or might be an oversight.
        // For safety, let's assume if it's undefined in the partial, we don't touch it unless it's explicitly deleteField()
        delete dataToUpdate.restaurantDescription; 
      }


      await updateDoc(profileDocRef, dataToUpdate);
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
    const newStaticMenuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${publicMerchantId}` : `/menu/${publicMerchantId}`; 
    try {
      const profileDocRef = doc(db, 'merchants', user.uid);
      await updateDoc(profileDocRef, { staticMenuUrl: newStaticMenuUrl, updatedAt: serverTimestamp() });
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
    regenerateAndSaveStaticMenuUrl,
  };
}
