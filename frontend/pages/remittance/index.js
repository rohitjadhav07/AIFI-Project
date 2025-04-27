import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import contractUtils from '../../utils/contracts';

export default function Remittance() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [originCountry, setOriginCountry] = useState('US');
  const [destinationCountry, setDestinationCountry] = useState('MX');
  const [fee, setFee] = useState('0');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [transfers, setTransfers] = useState([]);

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'MX', name: 'Mexico' },
    { code: 'BR', name: 'Brazil' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CO', name: 'Colombia' },
    { code: 'PE', name: 'Peru' },
    { code: 'CL', name: 'Chile' },
  ];

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if wallet is connected
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            // Load user data
            loadUserData(accounts[0]);
          } else {
            // Not connected - redirect to home
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();
  }, [router]);

  useEffect(() => {
    // Calculate fee whenever amount, origin, or destination changes
    if (amount && parseFloat(amount) > 0) {
      calculateFee();
    }
  }, [amount, originCountry, destinationCountry]);

  const loadUserData = async (userAddress) => {
    try {
      setLoading(true);
      
      // These would be actual calls to your contract utilities
      // const tokenBal = await contractUtils.getTokenBalance(userAddress);
      // const userTransfers = await contractUtils.getUserTransfers(userAddress);
      
      // For demo purposes, using placeholder values
      const tokenBal = ethers.utils.parseEther('1000');
      const userTransfers = [
        {
          id: 1,
          amount: '250',
          recipient: '0x1234...5678',
          originCountry: 'US',
          destinationCountry: 'MX',
          status: 'Completed',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          amount: '100',
          recipient: '0x8765...4321',
          originCountry: 'US',
          destinationCountry: 'BR',
          status: 'Pending',
          timestamp: new Date().toISOString()
        }
      ];
      
      setTokenBalance(ethers.utils.formatEther(tokenBal));
      setTransfers(userTransfers);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const calculateFee = () => {
    // This would normally call your AI fee calculator or contract
    // For demo, we're using a simple calculation
    let baseFee = parseFloat(amount) * 0.01; // 1% base fee
    
    // Add country-specific fees (simulating AI optimization)
    let countryMultiplier = 1.0;
    if (destinationCountry === 'MX') countryMultiplier = 0.8;
    if (destinationCountry === 'BR') countryMultiplier = 1.2;
    if (destinationCountry === 'AR') countryMultiplier = 1.5;
    
    const calculatedFee = baseFee * countryMultiplier;
    setFee(calculatedFee.toFixed(2));
  };

  const handleSend = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }

    if (!recipient) {
      setMessage('Please enter a recipient wallet address');
      return;
    }

    // Validate recipient is a proper Ethereum address
    if (!ethers.utils.isAddress(recipient)) {
      setMessage('Please enter a valid Ethereum wallet address');
      return;
    }

    if (parseFloat(amount) + parseFloat(fee) > parseFloat(tokenBalance)) {
      setMessage('Insufficient balance for this transfer');
      return;
    }

    try {
      setLoading(true);
      setMessage('Processing transfer...');
      
      // This would call your contract utility
      // const transferId = await contractUtils.sendMoney(
      //   tokenAddress, 
      //   ethers.utils.parseEther(amount),
      //   recipient,
      //   originCountry,
      //   destinationCountry
      // );
      
      // For demo, just update the UI
      const newTransfer = {
        id: transfers.length + 1,
        amount: amount,
        recipient: recipient,
        originCountry: originCountry,
        destinationCountry: destinationCountry,
        status: 'Pending',
        timestamp: new Date().toISOString()
      };
      
      setTransfers([newTransfer, ...transfers]);
      setTokenBalance(String(parseFloat(tokenBalance) - parseFloat(amount) - parseFloat(fee)));
      
      setMessage('Transfer initiated successfully!');
      setAmount('');
      setRecipient('');
      setLoading(false);
    } catch (error) {
      console.error('Error sending money:', error);
      setMessage('Transfer failed. Please try again.');
      setLoading(false);
    }
  };

  const goBack = () => {
    router.push('/');
  };

  return (
    <div className="container">
      <header>
        <h1>Smart Remittance</h1>
        <button onClick={goBack} className="back-button">← Back to Home</button>
      </header>

      <main>
        <div className="user-info">
          <h2>Your Information</h2>
          <p>Address: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ''}</p>
          <p>Token Balance: {tokenBalance} AIFI</p>
        </div>

        {message && (
          <div className={`message ${message.includes('failed') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="remittance-grid">
          <div className="form-card">
            <h3>Send Money</h3>
            <p>AI-optimized cross-border transfers</p>
            
            <div className="form-field">
              <label>Amount:</label>
              <input
                type="number"
                placeholder="Amount to send"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="form-field">
              <label>Recipient Wallet Address:</label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={loading}
              />
              <small className="form-hint">Enter a valid Ethereum wallet address</small>
            </div>
            
            <div className="form-field">
              <label>Origin Country:</label>
              <select 
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                disabled={loading}
              >
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-field">
              <label>Destination Country:</label>
              <select 
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                disabled={loading}
              >
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="fee-display">
              <p>AI-optimized Fee: {fee} AIFI</p>
              <p>Total: {amount ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : '0'} AIFI</p>
            </div>
            
            <button 
              onClick={handleSend} 
              disabled={loading}
              className="send-button"
            >
              {loading ? 'Processing...' : 'Send Money'}
            </button>
          </div>

          <div className="transfers-card">
            <h3>Your Transfers</h3>
            
            {transfers.length === 0 ? (
              <p className="no-transfers">No transfers yet</p>
            ) : (
              <div className="transfers-list">
                {transfers.map(transfer => (
                  <div key={transfer.id} className="transfer-item">
                    <div className="transfer-header">
                      <span className="transfer-amount">{transfer.amount} AIFI</span>
                      <span className={`transfer-status ${transfer.status.toLowerCase()}`}>
                        {transfer.status}
                      </span>
                    </div>
                    <p>To: {transfer.recipient}</p>
                    <p>From: {transfer.originCountry} → To: {transfer.destinationCountry}</p>
                    <p className="transfer-date">
                      {new Date(transfer.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: Arial, sans-serif;
        }
        
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        h1 {
          font-size: 2rem;
          color: #1a237e;
        }
        
        .back-button {
          background-color: #f5f5f5;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        
        .user-info {
          background-color: #f5f5f5;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
        }
        
        .message {
          padding: 1rem;
          border-radius: 0.25rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .success {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .error {
          background-color: #ffebee;
          color: #c62828;
        }
        
        .remittance-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .remittance-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .form-card, .transfers-card {
          background-color: #f5f5f5;
          padding: 1.5rem;
          border-radius: 0.5rem;
        }
        
        .form-card h3, .transfers-card h3 {
          color: #1a237e;
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .form-field {
          margin-bottom: 1rem;
        }
        
        .form-field label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }
        
        input, select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
        }
        
        .fee-display {
          background-color: #e8eaf6;
          padding: 1rem;
          border-radius: 0.25rem;
          margin: 1rem 0;
        }
        
        .fee-display p {
          margin: 0.5rem 0;
          font-weight: bold;
        }
        
        .send-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 0.25rem;
          width: 100%;
          cursor: pointer;
        }
        
        .send-button:disabled {
          background-color: #9fa8da;
          cursor: not-allowed;
        }
        
        .no-transfers {
          color: #757575;
          text-align: center;
          padding: 2rem 0;
        }
        
        .transfers-list {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .transfer-item {
          background-color: white;
          padding: 1rem;
          border-radius: 0.25rem;
          margin-bottom: 1rem;
          border-left: 4px solid #1a237e;
        }
        
        .transfer-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        
        .transfer-amount {
          font-weight: bold;
          font-size: 1.1rem;
        }
        
        .transfer-status {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
          font-weight: bold;
        }
        
        .transfer-status.completed {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .transfer-status.pending {
          background-color: #fff8e1;
          color: #f57f17;
        }
        
        .transfer-status.failed {
          background-color: #ffebee;
          color: #c62828;
        }
        
        .transfer-date {
          color: #757575;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        
        .form-hint {
          display: block;
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
} 