import React, { createContext, useState, useEffect, useContext, ReactNode, PropsWithChildren } from 'react';
import { UserProfile, Message, AppMode } from '../types';
import { subscribeToProfile, auth, isFirebaseAvailable, signInAnon, processPayment, updateIdentity } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AppContextType {
  userId: string | null;
  anyaProfile: UserProfile;
  setAnyaProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  handleUpgrade: (paymentId: string) => void;
  verifyIdentity: (data: { realName: string, nationality: string, idNumber: string, birthDate: string }) => Promise<void>;
  isAnonymous: boolean;
  imageGenerationCount: number;
  longTermMemories: string[];
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  name: 'Anya',
  trait: 'sanft',
  isPremium: false,
  imageGenerationCount: 0,
  balance: 0,
  transactions: [],
  idVerified: false
};

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [anyaProfile, setAnyaProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [appMode, setAppMode] = useState<AppMode>('chat');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [longTermMemories] = useState<string[]>([
    'Der Nutzer mag langsame, beruhigende Küsse.',
    'Der Nutzer möchte "Dorogoy" genannt werden.'
  ]);

  useEffect(() => {
    // Handle Auth
    if (isFirebaseAvailable() && auth) {
      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAnonymous(user.isAnonymous);
          
          // Subscribe to profile data
          const unsubProfile = subscribeToProfile(user.uid, (data) => {
            setAnyaProfile(prev => ({ ...prev, ...data }));
          });
          return () => unsubProfile();
        } else {
          signInAnon().catch(console.error);
        }
      });
      return () => unsubscribeAuth();
    } else {
      // Mock mode for when Firebase isn't configured
      setUserId("mock-user-123");
      setIsAnonymous(true);
    }
  }, []);

  const handleUpgrade = async (paymentId: string) => {
    // Optimistic update
    setAnyaProfile(prev => ({ 
        ...prev, 
        isPremium: true,
        balance: (prev.balance || 0) + 5.00 
    }));
    
    if (userId && isFirebaseAvailable()) {
        await processPayment(userId, 5.00, `Premium Sub - Ref: ${paymentId}`);
    }
  };

  const verifyIdentity = async (data: { realName: string, nationality: string, idNumber: string, birthDate: string }) => {
      setAnyaProfile(prev => ({
          ...prev,
          ...data,
          idVerified: true
      }));

      if (userId && isFirebaseAvailable()) {
          await updateIdentity(userId, data);
      }
  };

  return (
    <AppContext.Provider value={{
      userId,
      anyaProfile,
      setAnyaProfile,
      appMode,
      setAppMode,
      handleUpgrade,
      verifyIdentity,
      isAnonymous,
      imageGenerationCount: anyaProfile.imageGenerationCount,
      longTermMemories,
      showMobileMenu,
      setShowMobileMenu
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};