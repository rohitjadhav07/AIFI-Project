import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import contractUtils from '../../utils/contracts';

export default function Lending() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [deposits, setDeposits] = useState('0');
  const [loans, setLoans] = useState('0');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [loadingRiskData, setLoadingRiskData] = useState(false);
  const [showPartialRepay, setShowPartialRepay] = useState(false);
  const [healthFactor, setHealthFactor] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // First try auto-connect
        const savedAccount = await contractUtils.autoConnect();
        
        if (savedAccount) {
          setAccount(savedAccount);
          // Load user data
          loadUserData(savedAccount);
        } else if (typeof window.ethereum !== 'undefined') {
          // Fall back to checking current accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            // Load user data
            loadUserData(accounts[0]);
          } else {
            // Not connected - redirect to home
            router.push('/');
          }
        } else {
          // No ethereum provider - redirect to home
          router.push('/');
        }
        
        // Set up listeners for account changes and disconnects
        if (typeof window.ethereum !== 'undefined') {
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('disconnect', handleDisconnect);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        router.push('/');
      }
    };

    checkConnection();
    
    return () => {
      // Clean up listeners when component unmounts
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [router]);
  
  // Handle account changes from MetaMask
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      handleDisconnect();
    } else {
      // User switched accounts
      setAccount(accounts[0]);
      loadUserData(accounts[0]);
    }
  };
  
  // Handle disconnect event
  const handleDisconnect = () => {
    contractUtils.disconnectWallet();
    router.push('/');
  };

  // Add localStorage helpers for persistent storage
  const saveUserData = (userAddress, data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`userData_${userAddress}`, JSON.stringify(data));
    }
  };

  // Calculate and update health factor
  const updateHealthFactor = (depositValue, loanValue) => {
    const depositVal = parseFloat(depositValue);
    const loanVal = parseFloat(loanValue);
    
    if (loanVal <= 0) {
      setHealthFactor("∞"); // Infinity symbol when no loans
      return "∞";
    }
    
    const calculatedHealthFactor = depositVal / loanVal;
    setHealthFactor(calculatedHealthFactor.toFixed(2));
    return calculatedHealthFactor.toFixed(2);
  };

  const loadUserData = async (userAddress) => {
    try {
      setLoading(true);
      
      // First try to load data from localStorage for a better user experience
      let tokenBal, userDeposits, userLoans;
      let savedData = null;
      
      if (typeof window !== 'undefined') {
        const savedDataStr = localStorage.getItem(`userData_${userAddress}`);
        if (savedDataStr) {
          try {
            savedData = JSON.parse(savedDataStr);
          } catch (e) {
            console.error('Error parsing saved data:', e);
          }
        }
      }
      
      if (savedData) {
        // Use saved data if available
        tokenBal = ethers.utils.parseEther(savedData.tokenBalance);
        userDeposits = ethers.utils.parseEther(savedData.deposits);
        userLoans = ethers.utils.parseEther(savedData.loans);
      } else {
        // These are placeholder functions - would need to be implemented in your contracts.js
        // const tokenBal = await contractUtils.getTokenBalance(userAddress);
        // const userDeposits = await contractUtils.getUserDeposits(userAddress);
        // const userLoans = await contractUtils.getUserLoans(userAddress);
        
        // For demo purposes, using placeholder values
        tokenBal = ethers.utils.parseEther('1000');
        userDeposits = ethers.utils.parseEther('500');
        userLoans = ethers.utils.parseEther('200');
      }
      
      const tokenBalanceFormatted = ethers.utils.formatEther(tokenBal);
      const depositsFormatted = ethers.utils.formatEther(userDeposits);
      const loansFormatted = ethers.utils.formatEther(userLoans);
      
      setTokenBalance(tokenBalanceFormatted);
      setDeposits(depositsFormatted);
      setLoans(loansFormatted);
      
      // Calculate health factor
      updateHealthFactor(depositsFormatted, loansFormatted);
      
      // Save the data for future use
      saveUserData(userAddress, {
        tokenBalance: tokenBalanceFormatted,
        deposits: depositsFormatted,
        loans: loansFormatted,
        lastUpdated: new Date().toISOString()
      });
      
      // Also load AI risk assessment data
      loadRiskAssessment(userAddress);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const loadRiskAssessment = async (userAddress) => {
    try {
      setLoadingRiskData(true);
      
      // In a real implementation, this would call an actual AI service
      // For demo purposes, using simulated data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Sample risk level (would come from AI in production)
      const riskLevel = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
      
      // Calculate interest rate based on risk
      let interestRate = 0.05; // Base rate 5%
      let maxLoanAmount = 0;
      let ltv = 0;
      
      switch (riskLevel) {
        case 'low':
          interestRate += 0.02; // Additional 2%
          ltv = 0.8; // 80% LTV
          break;
        case 'medium':
          interestRate += 0.05; // Additional 5%
          ltv = 0.7; // 70% LTV
          break;
        case 'high':
          interestRate += 0.10; // Additional 10%
          ltv = 0.5; // 50% LTV
          break;
      }
      
      // Calculate max loan amount based on deposits and risk level
      const depositAmount = parseFloat(deposits);
      maxLoanAmount = depositAmount * ltv;
      
      // Prepare risk assessment data
      const assessmentData = {
        riskLevel,
        interestRate,
        maxLoanAmount,
        ltv,
        creditScore: 650 + Math.floor(Math.random() * 200),
        lastUpdated: new Date().toISOString(),
        factors: [
          {
            name: 'Transaction History',
            importance: 35,
            score: 65 + Math.floor(Math.random() * 30)
          },
          {
            name: 'Collateral Value',
            importance: 25,
            score: 70 + Math.floor(Math.random() * 30)
          },
          {
            name: 'Repayment History',
            importance: 40,
            score: 75 + Math.floor(Math.random() * 25)
          }
        ],
        recommendations: [
          'Maintain regular deposits to improve your credit score',
          'Ensure timely repayment of loans to reduce interest rates',
          'Consider increasing your collateral to unlock higher loan limits'
        ]
      };
      
      setRiskAssessment(assessmentData);
      setLoadingRiskData(false);
    } catch (error) {
      console.error('Error loading risk assessment:', error);
      setLoadingRiskData(false);
    }
  };

  const handleDeposit = async () => {
    if (!account) {
      setActionMessage('Please connect your wallet first');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setActionMessage('Please enter a valid deposit amount');
      return;
    }

    if (parseFloat(depositAmount) > parseFloat(tokenBalance)) {
      setActionMessage('Insufficient token balance');
      return;
    }

    try {
      setLoading(true);
      setActionMessage('Processing deposit...');
      
      // Call the actual contract
      const { provider, signer } = await contractUtils.getProviderAndSigner();
      if (!provider || !signer) {
        throw new Error('Wallet connection not available');
      }
      
      // Parse the amount to the proper format for the blockchain
      const depositAmountWei = ethers.utils.parseUnits(depositAmount.toString(), 18);
      
      // Call the deposit function from the contract utility
      const tx = await contractUtils.deposit(contractUtils.CONTRACT_ADDRESSES.token, depositAmountWei);
      console.log('Deposit transaction:', tx);
      
      // Update UI state
      const newTokenBalanceValue = (parseFloat(tokenBalance) - parseFloat(depositAmount)).toFixed(2);
      const newDepositsValue = (parseFloat(deposits) + parseFloat(depositAmount)).toFixed(2);
      
      setTokenBalance(newTokenBalanceValue);
      setDeposits(newDepositsValue);
      setDepositAmount('');
      setActionMessage('Deposit successful!');
      
      // Update health factor
      updateHealthFactor(newDepositsValue, loans);
      
      // Save updated data to localStorage
      saveUserData(account, {
        tokenBalance: newTokenBalanceValue,
        deposits: newDepositsValue,
        loans: loans,
        lastUpdated: new Date().toISOString()
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing deposit:', error);
      setActionMessage(`Deposit failed: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!account) {
      setActionMessage('Please connect your wallet first');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setActionMessage('Please enter a valid withdrawal amount');
      return;
    }

    // Check if user has enough deposits to withdraw
    if (parseFloat(withdrawAmount) > parseFloat(deposits)) {
      setActionMessage('Withdrawal amount exceeds your deposits');
      return;
    }

    // Check if withdrawal would put loans at risk
    const newDeposits = parseFloat(deposits) - parseFloat(withdrawAmount);
    const healthFactorAfterWithdraw = calculateHealthFactor(newDeposits, loans);
    
    if (loans > 0 && healthFactorAfterWithdraw < 1.2) {
      setActionMessage('Withdrawal would put your loans at risk of liquidation (health factor < 1.2)');
      return;
    }

    try {
      setLoading(true);
      setActionMessage('Processing withdrawal...');
      
      // Call the actual contract
      const { provider, signer } = await contractUtils.getProviderAndSigner();
      if (!provider || !signer) {
        throw new Error('Wallet connection not available');
      }
      
      // Parse the amount to the proper format for the blockchain
      const withdrawAmountWei = ethers.utils.parseUnits(withdrawAmount.toString(), 18);
      
      // Call the withdraw function from the contract utility
      const tx = await contractUtils.withdraw(contractUtils.CONTRACT_ADDRESSES.token, withdrawAmountWei);
      console.log('Withdraw transaction:', tx);
      
      // Update UI state
      const newTokenBalanceValue = (parseFloat(tokenBalance) + parseFloat(withdrawAmount)).toFixed(2);
      const newDepositsValue = (parseFloat(deposits) - parseFloat(withdrawAmount)).toFixed(2);
      
      setTokenBalance(newTokenBalanceValue);
      setDeposits(newDepositsValue);
      setWithdrawAmount('');
      setActionMessage('Withdrawal successful!');
      
      // Update health factor based on new deposits
      updateHealthFactor(newDepositsValue, loans);
      
      // Save updated data to localStorage
      saveUserData(account, {
        tokenBalance: newTokenBalanceValue,
        deposits: newDepositsValue,
        loans: loans,
        lastUpdated: new Date().toISOString()
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setActionMessage(`Withdrawal failed: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!account) {
      setActionMessage('Please connect your wallet first');
      return;
    }

    if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
      setActionMessage('Please enter a valid borrow amount');
      return;
    }
    
    // Get max loan amount based on assessment
    const maxLoanAmount = (parseFloat(deposits) * riskAssessment.ltv).toFixed(2);
    
    if (parseFloat(borrowAmount) > parseFloat(maxLoanAmount)) {
      setActionMessage(`Cannot borrow more than ${maxLoanAmount} tokens based on your risk assessment`);
      return;
    }
    
    // Calculate projected health factor
    const newLoans = parseFloat(loans) + parseFloat(borrowAmount);
    const healthFactorAfterBorrow = calculateHealthFactor(deposits, newLoans);
    
    if (healthFactorAfterBorrow < 1.2) {
      setActionMessage('Borrowing this amount would put your position at risk (health factor < 1.2)');
      return;
    }

    try {
      setLoading(true);
      setActionMessage('Processing loan...');
      
      // Call the actual contract
      const { provider, signer } = await contractUtils.getProviderAndSigner();
      if (!provider || !signer) {
        throw new Error('Wallet connection not available');
      }
      
      // Parse the amount to the proper format for the blockchain
      const borrowAmountWei = ethers.utils.parseUnits(borrowAmount.toString(), 18);
      
      // Call the borrow function from the contract utility
      const tx = await contractUtils.borrow(contractUtils.CONTRACT_ADDRESSES.token, borrowAmountWei);
      console.log('Borrow transaction:', tx);
      
      // Update UI state
      const newTokenBalanceValue = (parseFloat(tokenBalance) + parseFloat(borrowAmount)).toFixed(2);
      const newLoansValue = (parseFloat(loans) + parseFloat(borrowAmount)).toFixed(2);
      
      setTokenBalance(newTokenBalanceValue);
      setLoans(newLoansValue);
      setBorrowAmount('');
      setActionMessage('Loan approved and tokens transferred to your wallet!');
      
      // Update health factor based on new loan amount
      updateHealthFactor(deposits, newLoansValue);
      
      // Save updated data to localStorage
      saveUserData(account, {
        tokenBalance: newTokenBalanceValue,
        deposits: deposits,
        loans: newLoansValue,
        lastUpdated: new Date().toISOString()
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing loan:', error);
      setActionMessage(`Borrowing failed: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    if (!account) {
      setActionMessage('Please connect your wallet first');
      return;
    }

    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      setActionMessage('Please enter a valid repay amount');
      return;
    }

    if (parseFloat(repayAmount) > parseFloat(tokenBalance)) {
      setActionMessage('Insufficient token balance for this repayment');
      return;
    }

    // If repay amount is greater than loans, limit it to the total loan amount
    const finalRepayAmount = parseFloat(repayAmount) > parseFloat(loans) 
      ? loans 
      : repayAmount;

    try {
      setLoading(true);
      setActionMessage('Processing repayment...');
      
      // Call the actual contract
      const { provider, signer } = await contractUtils.getProviderAndSigner();
      if (!provider || !signer) {
        throw new Error('Wallet connection not available');
      }
      
      // Parse the amount to the proper format for the blockchain
      const repayAmountWei = ethers.utils.parseUnits(finalRepayAmount.toString(), 18);
      
      // Call the repay function from the contract utility
      const tx = await contractUtils.repay(contractUtils.CONTRACT_ADDRESSES.token, repayAmountWei);
      console.log('Repay transaction:', tx);
      
      // Update UI state
      const newTokenBalanceValue = (parseFloat(tokenBalance) - parseFloat(finalRepayAmount)).toFixed(2);
      const newLoansValue = (parseFloat(loans) - parseFloat(finalRepayAmount)).toFixed(2);
      
      setTokenBalance(newTokenBalanceValue);
      setLoans(newLoansValue);
      setRepayAmount('');
      setActionMessage('Repayment successful!');
      
      // Update health factor
      updateHealthFactor(deposits, newLoansValue);
      
      // Save updated data to localStorage
      saveUserData(account, {
        tokenBalance: newTokenBalanceValue,
        deposits: deposits,
        loans: newLoansValue,
        lastUpdated: new Date().toISOString()
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing repayment:', error);
      setActionMessage(`Repayment failed: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handlePartialRepay = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      setActionMessage('Please enter a valid repayment amount');
      return;
    }

    if (parseFloat(repayAmount) > parseFloat(tokenBalance)) {
      setActionMessage('Insufficient balance for this repayment');
      return;
    }

    if (parseFloat(repayAmount) > parseFloat(loans)) {
      setActionMessage('Repayment amount exceeds your loan balance');
      return;
    }

    try {
      setLoading(true);
      setActionMessage('Processing partial repayment...');
      
      // Call the actual contract
      const { provider, signer } = await contractUtils.getProviderAndSigner();
      if (!provider || !signer) {
        throw new Error('Wallet connection not available');
      }
      
      // Parse the amount to the proper format for the blockchain
      const repayAmountWei = ethers.utils.parseUnits(repayAmount.toString(), 18);
      
      // Call the repay function from the contract utility
      const tx = await contractUtils.repay(contractUtils.CONTRACT_ADDRESSES.token, repayAmountWei);
      console.log('Partial repay transaction:', tx);
      
      // Update UI state with proper precision
      const newTokenBalance = (parseFloat(tokenBalance) - parseFloat(repayAmount)).toFixed(2);
      const newLoans = (parseFloat(loans) - parseFloat(repayAmount)).toFixed(2);
      
      setTokenBalance(newTokenBalance);
      setLoans(newLoans);
      setRepayAmount('');
      setActionMessage('Partial repayment successful!');
      
      // Update health factor
      updateHealthFactor(deposits, newLoans);
      
      // Save updated data to localStorage
      saveUserData(account, {
        tokenBalance: newTokenBalance,
        deposits: deposits,
        loans: newLoans,
        lastUpdated: new Date().toISOString()
      });
      
      // Hide partial repayment UI after successful repayment
      setShowPartialRepay(false);
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing partial repayment:', error);
      setActionMessage(`Repayment failed: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const goBack = () => {
    router.push('/');
  };

  return (
    <div className="container">
      <header>
        <h1>AI-Powered Lending Pool</h1>
        <button onClick={goBack} className="back-button">← Back to Home</button>
      </header>

      <main>
        <div className="user-info">
          <h2>Your Information</h2>
          <p>Address: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ''}</p>
          <p>Token Balance: {tokenBalance} AIFI</p>
          <p>Your Deposits: {deposits} AIFI</p>
          <p>Your Loans: {loans} AIFI</p>
          
          <div className="health-factor-container">
            <p>Health Factor: 
              <span className={`health-factor ${
                healthFactor === "∞" ? "safe" : 
                parseFloat(healthFactor) >= 2 ? "safe" : 
                parseFloat(healthFactor) >= 1.5 ? "medium" : 
                parseFloat(healthFactor) >= 1.2 ? "warning" : "danger"
              }`}>
                {healthFactor || "∞"}
              </span>
            </p>
            <div className="health-factor-tooltip">
              <div className="tooltip-icon">?</div>
              <div className="tooltip-text">
                <p>Health Factor indicates the safety of your position:</p>
                <ul>
                  <li><span className="safe">≥ 2.0</span>: Very safe</li>
                  <li><span className="medium">≥ 1.5</span>: Safe</li>
                  <li><span className="warning">≥ 1.2</span>: Caution</li>
                  <li><span className="danger">&lt; 1.2</span>: Risk of liquidation</li>
                </ul>
                <p>If your health factor falls below 1.0, your position may be liquidated.</p>
              </div>
            </div>
          </div>
        </div>

        {actionMessage && (
          <div className={`message ${actionMessage.includes('failed') ? 'error' : 'success'}`}>
            {actionMessage}
          </div>
        )}

        <div className="risk-assessment-section">
          <div className="risk-header">
            <h2>AI Risk Assessment</h2>
            <button 
              onClick={() => setShowRiskDetails(!showRiskDetails)}
              className="toggle-details"
            >
              {showRiskDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {loadingRiskData ? (
            <div className="loading-risk">Loading your risk assessment...</div>
          ) : riskAssessment ? (
            <div className="risk-content">
              <div className="risk-summary">
                <div className="risk-level">
                  <span className="risk-label">Risk Level:</span>
                  <span className={`risk-value ${riskAssessment.riskLevel}`}>
                    {riskAssessment.riskLevel.toUpperCase()}
                  </span>
                </div>
                
                <div className="risk-rate">
                  <span className="risk-label">Your Interest Rate:</span>
                  <span className="risk-value">
                    {(riskAssessment.interestRate * 100).toFixed(2)}%
                  </span>
                </div>
                
                <div className="risk-loan-limit">
                  <span className="risk-label">Maximum Loan Amount:</span>
                  <span className="risk-value">
                    {riskAssessment.maxLoanAmount.toFixed(2)} AIFI
                  </span>
                </div>
              </div>
              
              {showRiskDetails && (
                <div className="risk-details">
                  <div className="risk-factors">
                    <h3>Assessment Factors</h3>
                    <div className="factors-container">
                      {riskAssessment.factors.map((factor, index) => (
                        <div key={index} className="factor">
                          <div className="factor-header">
                            <span className="factor-name">{factor.name}</span>
                            <span className="factor-importance">{factor.importance}% weight</span>
                          </div>
                          <div className="factor-score-container">
                            <div 
                              className="factor-score-bar"
                              style={{width: `${factor.score}%`}}
                            ></div>
                          </div>
                          <div className="factor-score-value">{factor.score}/100</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="ai-explanation">
                    <h3>How AI Determines Your Rate</h3>
                    <p>
                      Our advanced AI uses machine learning to analyze multiple data points from your on-chain activity,
                      including transaction patterns, deposit history, and previous loan repayments. Unlike traditional
                      credit scoring that relies on credit bureaus, our system provides personalized rates based on
                      your blockchain activity.
                    </p>
                    <div className="ai-process">
                      <div className="process-step">
                        <div className="step-number">1</div>
                        <div className="step-description">
                          <h4>Data Collection</h4>
                          <p>Analyzes your blockchain transactions and interactions</p>
                        </div>
                      </div>
                      
                      <div className="process-step">
                        <div className="step-number">2</div>
                        <div className="step-description">
                          <h4>Risk Modeling</h4>
                          <p>Processes data through our RandomForest classifier</p>
                        </div>
                      </div>
                      
                      <div className="process-step">
                        <div className="step-number">3</div>
                        <div className="step-description">
                          <h4>Personalization</h4>
                          <p>Generates your custom interest rate and loan limit</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="risk-recommendations">
                    <h3>Personalized Recommendations</h3>
                    <ul>
                      {riskAssessment.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-risk-data">Unable to load risk assessment data.</div>
          )}
        </div>

        <div className="actions-grid">
          <div className="action-card">
            <h3>Deposit Funds</h3>
            <p>Earn interest on your deposits</p>
            <input
              type="number"
              placeholder="Amount to deposit"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={handleDeposit} 
              disabled={loading}
              className="action-button"
            >
              {loading ? 'Processing...' : 'Deposit'}
            </button>
          </div>

          <div className="action-card">
            <h3>Withdraw Funds</h3>
            <p>Withdraw your deposited funds</p>
            <input
              type="number"
              placeholder="Amount to withdraw"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={handleWithdraw} 
              disabled={loading}
              className="action-button"
            >
              {loading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>

          <div className="action-card">
            <h3>Borrow Funds</h3>
            <p>AI-powered personalized rates</p>
            <input
              type="number"
              placeholder="Amount to borrow"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={handleBorrow} 
              disabled={loading}
              className="action-button"
            >
              {loading ? 'Processing...' : 'Borrow'}
            </button>
          </div>

          <div className="action-card">
            <h3>Repay Loan</h3>
            <p>Repay your outstanding loans</p>
            <p className="loan-amount">Loan amount: {loans} AIFI</p>
            
            {showPartialRepay ? (
              <>
                <input
                  type="number"
                  placeholder="Amount to repay"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  disabled={loading}
                />
                <div className="button-group">
                  <button 
                    onClick={handlePartialRepay} 
                    disabled={loading || !repayAmount || parseFloat(repayAmount) <= 0}
                    className="action-button"
                  >
                    {loading ? 'Processing...' : 'Repay Partial Amount'}
                  </button>
                  <button 
                    onClick={() => {
                      setShowPartialRepay(false);
                      setRepayAmount('');
                      setActionMessage('');
                    }}
                    disabled={loading}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={handleRepay} 
                disabled={loading || parseFloat(loans) <= 0}
                className="action-button"
              >
                {loading ? 'Processing...' : 'Repay Full Amount'}
              </button>
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
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        .action-card {
          background-color: #f5f5f5;
          padding: 1.5rem;
          border-radius: 0.5rem;
          display: flex;
          flex-direction: column;
        }
        
        .action-card h3 {
          color: #1a237e;
          margin-top: 0;
        }
        
        input {
          padding: 0.75rem;
          margin: 0.5rem 0;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
        }
        
        .action-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 0.25rem;
          margin-top: auto;
          cursor: pointer;
        }
        
        .action-button:disabled {
          background-color: #9fa8da;
          cursor: not-allowed;
        }
        
        .loan-amount {
          font-weight: bold;
          margin: 1rem 0;
        }

        .risk-assessment-section {
          background-color: #f5f5f5;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
          border-left: 4px solid #1a237e;
        }
        
        .risk-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .toggle-details {
          background: transparent;
          border: 1px solid #1a237e;
          color: #1a237e;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        
        .toggle-details:hover {
          background-color: #e8eaf6;
        }
        
        .loading-risk {
          text-align: center;
          padding: 1rem;
          font-style: italic;
          color: #666;
        }
        
        .risk-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          margin-bottom: 1rem;
        }
        
        .risk-label {
          font-weight: bold;
          margin-right: 0.5rem;
          color: #666;
        }
        
        .risk-value {
          font-size: 1.1rem;
        }
        
        .risk-value.low {
          color: #2e7d32;
        }
        
        .risk-value.medium {
          color: #f57c00;
        }
        
        .risk-value.high {
          color: #c62828;
        }
        
        .risk-details {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #ddd;
        }
        
        .risk-factors {
          margin-bottom: 1.5rem;
        }
        
        .factor {
          margin-bottom: 1rem;
        }
        
        .factor-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        
        .factor-name {
          font-weight: bold;
        }
        
        .factor-importance {
          color: #666;
          font-size: 0.9rem;
        }
        
        .factor-score-container {
          width: 100%;
          height: 0.5rem;
          background-color: #e0e0e0;
          border-radius: 0.25rem;
          overflow: hidden;
        }
        
        .factor-score-bar {
          height: 100%;
          background-color: #1a237e;
          border-radius: 0.25rem;
        }
        
        .factor-score-value {
          text-align: right;
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }
        
        .ai-explanation {
          background-color: #e8eaf6;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .ai-process {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .process-step {
          flex: 1;
          min-width: 200px;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        
        .step-number {
          width: 2rem;
          height: 2rem;
          background-color: #1a237e;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        .step-description h4 {
          margin: 0 0 0.5rem 0;
          color: #1a237e;
        }
        
        .step-description p {
          margin: 0;
          font-size: 0.9rem;
        }
        
        .risk-recommendations ul {
          padding-left: 1.5rem;
        }
        
        .risk-recommendations li {
          margin-bottom: 0.5rem;
        }
        
        .button-group {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .secondary-button {
          background-color: #e0e0e0;
          color: #333;
          border: none;
          padding: 0.75rem;
          border-radius: 0.25rem;
          cursor: pointer;
          flex: 1;
        }
        
        .secondary-button:hover {
          background-color: #d0d0d0;
        }
        
        .secondary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .health-factor-container {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
        }

        .health-factor {
          font-weight: bold;
          margin-left: 0.5rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        .health-factor.safe {
          background-color: #e8f5e9;
          color: #2e7d32;
        }

        .health-factor.medium {
          background-color: #fff8e1;
          color: #f57f17;
        }

        .health-factor.warning {
          background-color: #fff3e0;
          color: #e64a19;
        }

        .health-factor.danger {
          background-color: #ffebee;
          color: #c62828;
        }

        .health-factor-tooltip {
          position: relative;
          margin-left: 0.5rem;
        }

        .tooltip-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          background-color: #e0e0e0;
          color: #333;
          border-radius: 50%;
          font-size: 0.8rem;
          cursor: help;
        }

        .tooltip-text {
          position: absolute;
          left: 1.5rem;
          top: -0.5rem;
          width: 250px;
          background-color: #424242;
          color: white;
          padding: 0.75rem;
          border-radius: 0.25rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          z-index: 10;
          display: none;
        }

        .health-factor-tooltip:hover .tooltip-text {
          display: block;
        }

        .tooltip-text ul {
          margin: 0.5rem 0;
          padding-left: 1rem;
        }

        .tooltip-text li {
          margin-bottom: 0.25rem;
        }

        .tooltip-text .safe {
          color: #4caf50;
        }

        .tooltip-text .medium {
          color: #ff9800;
        }

        .tooltip-text .warning {
          color: #ff5722;
        }

        .tooltip-text .danger {
          color: #f44336;
        }
      `}</style>
    </div>
  );
} 