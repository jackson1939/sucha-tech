'use client';
import { useState, useEffect, useCallback } from 'react';

export type ChainType = 'solana' | 'evm';
export interface WalletState {
  address: string | null;
  chain: ChainType | null;
  chainName: string | null;
  walletName: string | null;
  connected: boolean;
  connecting: boolean;
}

const EVM_CHAINS: Record<string, string> = {
  '0x1': 'Ethereum', '0x38': 'BNB Chain', '0x89': 'Polygon',
  '0xa86a': 'Avalanche', '0xfa': 'Fantom', '0xa4b1': 'Arbitrum',
  '0xa': 'Optimism', '0x2105': 'Base',
  '0xaa36a7': 'Ethereum Sepolia', '0x13881': 'Polygon Mumbai',
};

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null, chain: null, chainName: null, walletName: null,
    connected: false, connecting: false,
  });

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vb_wallet');
      if (saved) {
        const w = JSON.parse(saved) as WalletState;
        setState(w);
      }
    } catch {}
  }, []);

  const save = (w: WalletState) => {
    setState(w);
    try { localStorage.setItem('vb_wallet', JSON.stringify(w)); } catch {}
  };

  // Connect Phantom (Solana)
  const connectPhantom = useCallback(async () => {
    setState(s => ({ ...s, connecting: true }));
    try {
      const w = (window as any).solana;
      if (!w?.isPhantom) { window.open('https://phantom.app', '_blank'); return; }
      const resp = await w.connect();
      const addr = resp.publicKey.toString();
      save({ address: addr, chain: 'solana', chainName: 'Solana', walletName: 'Phantom', connected: true, connecting: false });
    } catch { setState(s => ({ ...s, connecting: false })); }
  }, []);

  // Connect MetaMask / any EVM wallet
  const connectMetaMask = useCallback(async (walletName = 'MetaMask') => {
    setState(s => ({ ...s, connecting: true }));
    try {
      const eth = (window as any).ethereum;
      if (!eth) { window.open('https://metamask.io', '_blank'); setState(s => ({ ...s, connecting: false })); return; }
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      const chainId: string = await eth.request({ method: 'eth_chainId' });
      const chainName = EVM_CHAINS[chainId] ?? `Chain ${chainId}`;
      save({ address: accounts[0], chain: 'evm', chainName, walletName, connected: true, connecting: false });
    } catch { setState(s => ({ ...s, connecting: false })); }
  }, []);

  // Connect Core Wallet (AVAX) - uses window.avalanche
  const connectCore = useCallback(async () => {
    setState(s => ({ ...s, connecting: true }));
    try {
      const av = (window as any).avalanche;
      if (av) {
        const accounts: string[] = await av.request({ method: 'eth_requestAccounts' });
        save({ address: accounts[0], chain: 'evm', chainName: 'Avalanche', walletName: 'Core', connected: true, connecting: false });
      } else if ((window as any).ethereum) {
        await connectMetaMask('Core');
      } else {
        window.open('https://core.app', '_blank');
        setState(s => ({ ...s, connecting: false }));
      }
    } catch { setState(s => ({ ...s, connecting: false })); }
  }, [connectMetaMask]);

  const disconnect = useCallback(() => {
    const empty: WalletState = { address: null, chain: null, chainName: null, walletName: null, connected: false, connecting: false };
    save(empty);
    try { localStorage.removeItem('vb_wallet'); } catch {}
  }, []);

  return { ...state, connectPhantom, connectMetaMask, connectCore, disconnect };
}
