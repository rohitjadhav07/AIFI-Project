import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';

// Import contract utilities
import contractUtils from '../utils/contracts';

// Will need to import contract ABIs from artifacts

export default function Home() {
  const [account, setAccount] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Auto-connect on component mount
  useEffect(() => {
    const tryAutoConnect = async () => {
      try {
        const savedAccount = await contractUtils.autoConnect();
        if (savedAccount) {
          setAccount(savedAccount);
          setConnected(true);
        }
      } catch (error) {
        console.error('Auto-connect error:', error);
      }
    };
    
    tryAutoConnect();
    
    // Also set up listeners for account changes and disconnects
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
    
    return () => {
      // Clean up listeners when component unmounts
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);
  
  // Handle account changes from MetaMask
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      handleDisconnect();
    } else {
      // User switched accounts
      setAccount(accounts[0]);
      setConnected(true);
    }
  };
  
  // Handle disconnect event
  const handleDisconnect = () => {
    setAccount('');
    setConnected(false);
  };
  
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        const { signer } = await contractUtils.getProviderAndSigner();
        const connectedAccount = await signer.getAddress();
        setAccount(connectedAccount);
        setConnected(true);
        setLoading(false);
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        setLoading(false);
      }
    } else {
      alert('Please install MetaMask to use this application');
    }
  };
  
  const disconnectWallet = async () => {
    try {
      setLoading(true);
      await contractUtils.disconnectWallet();
      setAccount('');
      setConnected(false);
      setLoading(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setLoading(false);
    }
  };

  // Navigation handlers for each feature
  const navigateToLending = () => {
    if (connected) {
      router.push('/lending');
    } else {
      alert('Please connect your wallet first');
    }
  };

  const navigateToRemittance = () => {
    if (connected) {
      router.push('/remittance');
    } else {
      alert('Please connect your wallet first');
    }
  };

  const navigateToVoice = () => {
    if (connected) {
      router.push('/voice');
    } else {
      alert('Please connect your wallet first');
    }
  };
  
  return (
    <div className="container">
      <header>
        <h1>AIFi Platform</h1>
        <p>AI-powered DeFi on Rootstock</p>
        
        <div className="wallet-connection">
          {!connected ? (
            <button 
              onClick={connectWallet} 
              disabled={loading}
              className="connect-button"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="connected-info">
              <p className="account-display">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </p>
              <button 
                onClick={disconnectWallet}
                disabled={loading}
                className="disconnect-button"
              >
                {loading ? 'Processing...' : 'Disconnect'}
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main>
        <section className="features">
          <div className="feature-card">
            <h2>AI-Powered Lending</h2>
            <p>Get personalized interest rates based on AI risk assessment</p>
            <button 
              className="feature-button" 
              disabled={!connected}
              onClick={navigateToLending}
            >
              Access Lending Pool
            </button>
          </div>
          
          <div className="feature-card">
            <h2>Smart Remittances</h2>
            <p>Send money across borders with optimized fees and routes</p>
            <button 
              className="feature-button" 
              disabled={!connected}
              onClick={navigateToRemittance}
            >
              Send Money
            </button>
          </div>
          
          <div className="feature-card">
            <h2>Voice Interface</h2>
            <p>Use voice commands to interact with AIFi contracts</p>
            <button 
              className="feature-button" 
              disabled={!connected}
              onClick={navigateToVoice}
            >
              Try Voice Commands
            </button>
          </div>
        </section>
      </main>
      
      <footer>
        <p>AIFi Platform - Rootstock AI Hackathon 2025</p>
      </footer>
      
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: Arial, sans-serif;
        }
        
        header {
          text-align: center;
          margin-bottom: 3rem;
        }
        
        h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: #1a237e;
        }
        
        .wallet-connection {
          margin-top: 1.5rem;
        }
        
        .connect-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.25rem;
          font-size: 1rem;
          cursor: pointer;
        }
        
        .connect-button:hover {
          background-color: #303f9f;
        }
        
        .connected-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        
        .account-display {
          font-weight: bold;
          background-color: #f5f5f5;
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          margin: 0;
        }
        
        .disconnect-button {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        
        .disconnect-button:hover {
          background-color: #d32f2f;
        }
        
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .feature-card {
          background-color: #f5f5f5;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          text-align: center;
        }
        
        .feature-card h2 {
          color: #1a237e;
          margin-bottom: 1rem;
        }
        
        .feature-button {
          background-color: #303f9f;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          margin-top: 1rem;
          cursor: pointer;
        }
        
        .feature-button:hover {
          background-color: #1a237e;
        }
        
        .feature-button:disabled {
          background-color: #9fa8da;
          cursor: not-allowed;
        }
        
        footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
      `}</style>
    </div>
  );
} 