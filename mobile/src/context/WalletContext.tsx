import React, { createContext, useContext, useEffect, useState } from 'react';
import { createWallet, loadWallet, hasWallet, WalletInfo } from '../lib/wallet';

interface WalletContextValue {
  wallet: WalletInfo | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => WalletInfo;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted wallet on mount
    const existing = loadWallet();
    if (existing) setWallet(existing);
    setIsLoading(false);
  }, []);

  function connect(): WalletInfo {
    const info = hasWallet() ? loadWallet()! : createWallet();
    setWallet(info);
    return info;
  }

  function disconnect(): void {
    setWallet(null);
  }

  return (
    <WalletContext.Provider
      value={{
        wallet,
        isConnected: wallet !== null,
        isLoading,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
