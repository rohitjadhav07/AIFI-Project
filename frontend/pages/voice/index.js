import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import contractUtils from '../../utils/contracts';
import aiServices from '../../utils/ai-services';

export default function VoiceInterface() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [recording, setRecording] = useState(false);
  const [command, setCommand] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [actionDetails, setActionDetails] = useState(null);
  const [recentCommands, setRecentCommands] = useState([]);
  const [language, setLanguage] = useState('en');
  const [intentConfidence, setIntentConfidence] = useState(null);
  const [recognizedEntities, setRecognizedEntities] = useState(null);
  const [showAIDetails, setShowAIDetails] = useState(false);

  // Media recorder state
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  
  // Reference to the voice recognition service
  const voiceService = aiServices.voiceRecognition;

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // First try auto-connect
        const savedAccount = await contractUtils.autoConnect();
        
        if (savedAccount) {
          setAccount(savedAccount);
          // Load user data
          loadRecentCommands(savedAccount);
        } else if (typeof window.ethereum !== 'undefined') {
          // Fall back to checking current accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            // Load user data
            loadRecentCommands(accounts[0]);
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
      
      // Clean up media recorder if active
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
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
      loadRecentCommands(accounts[0]);
    }
  };
  
  // Handle disconnect event
  const handleDisconnect = () => {
    contractUtils.disconnectWallet();
    router.push('/');
  };

  const loadRecentCommands = async (userAddress) => {
    try {
      // For demo purposes, use simulated data
      // In production, this would fetch actual command history from the contract or API
      setRecentCommands([
        {
          command: "Check my balance",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: "Completed",
          result: "Balance: 1,250 AIFI"
        },
        {
          command: "Send 100 AIFI to 0x1234",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: "Completed",
          result: "Transfer successful: Tx 0x56789..."
        },
        {
          command: "Deposit 200 AIFI",
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          status: "Completed",
          result: "Deposit confirmed: Tx 0xabcde..."
        }
      ]);
    } catch (error) {
      console.error('Error loading recent commands:', error);
    }
  };

  const startRecording = async () => {
    try {
      setMessage('');
      setActionDetails(null);
      setIntentConfidence(null);
      setRecognizedEntities(null);
      
      // Check if browser supports audio recording
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMessage('Your browser does not support audio recording. Please type your command instead.');
        return;
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      // Set up event listeners
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, e.data]);
        }
      };
      
      recorder.onstop = async () => {
        // Convert audio chunks to blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        // In a real implementation, you would send this audio to a speech-to-text service
        // For demo purposes, if command field is empty, simulate voice recognition with a default message
        if (command) {
          processCommand(command);
        } else {
          // For simulation, use a default recognized command if user didn't type anything
          const defaultCommand = "Check my balance";
          setCommand(defaultCommand);
          processCommand(defaultCommand);
        }
        
        // Reset audio chunks
        setAudioChunks([]);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      recorder.start();
      setRecording(true);
      
      // Set a timeout to automatically stop recording after 5 seconds
      setTimeout(() => {
        if (recording && mediaRecorder && mediaRecorder.state === 'recording') {
          stopRecording();
        }
      }, 5000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setMessage('Error accessing microphone. Please check permissions and try again, or type your command instead.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const processCommand = async (text) => {
    try {
      setProcessing(true);
      
      // Use the voice service to process the command
      const result = await voiceService.processCommand(text);
      
      if (result.success) {
        setMessage(`Command recognized: ${result.transaction.description}`);
        setActionDetails(result.transaction);
        setIntentConfidence(result.confidence);
        setRecognizedEntities(result.entities);
        
        // Add to recent commands
        const newCommand = {
          command: text,
          timestamp: new Date().toISOString(),
          status: "Pending",
          result: result.transaction.description
        };
        
        setRecentCommands([newCommand, ...recentCommands.slice(0, 4)]);
      } else {
        setMessage(result.message || 'Could not understand command. Please try again.');
      }
      
      setProcessing(false);
    } catch (error) {
      console.error('Error processing command:', error);
      setMessage('Error processing command. Please try again.');
      setProcessing(false);
    }
  };

  const confirmAction = async () => {
    try {
      if (!actionDetails) return;
      
      setProcessing(true);
      setMessage('Processing transaction...');
      
      // In a real implementation, this would call the smart contract
      // For demo purposes, simulate a successful transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the most recent command status
      const updatedCommands = [...recentCommands];
      updatedCommands[0].status = "Completed";
      updatedCommands[0].result = `Transaction successful: Tx 0x${Math.random().toString(16).substr(2, 40)}`;
      setRecentCommands(updatedCommands);
      
      setMessage('Transaction completed successfully!');
      setActionDetails(null);
      setProcessing(false);
    } catch (error) {
      console.error('Error executing action:', error);
      setMessage('Error executing transaction. Please try again.');
      setProcessing(false);
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    voiceService.setLanguage(newLanguage);
  };

  const cancelAction = () => {
    setActionDetails(null);
    setMessage('Action canceled.');
    
    // Update the most recent command status
    const updatedCommands = [...recentCommands];
    if (updatedCommands.length > 0) {
      updatedCommands[0].status = "Canceled";
      setRecentCommands(updatedCommands);
    }
  };

  const goBack = () => {
    router.push('/');
  };

  // Get example commands for selected language
  const exampleCommands = voiceService.getExampleCommands(language);

  // Add a function for submitting commands manually
  const handleSubmitCommand = () => {
    if (!command) {
      setMessage('Please enter a command');
      return;
    }
    processCommand(command);
  };

  return (
    <div className="container">
      <header>
        <h1>AI Voice Interface</h1>
        <button onClick={goBack} className="back-button">← Back to Home</button>
      </header>

      <main>
        <div className="voice-controls">
          <div className="language-selector">
            <label htmlFor="language-select">Select Language:</label>
            <select 
              id="language-select" 
              value={language} 
              onChange={handleLanguageChange}
              disabled={recording || processing}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
          
          <div className="command-input">
            <input
              type="text"
              placeholder={recording ? "Listening..." : "Type a command or press Record"}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={recording || processing}
              className="command-input-field"
            />
            
            {!recording ? (
              <>
                <button 
                  onClick={startRecording} 
                  disabled={processing}
                  className="record-button"
                >
                  🎤 Record
                </button>
                <button 
                  onClick={handleSubmitCommand}
                  disabled={!command || processing || recording}
                  className="submit-button"
                >
                  Submit
                </button>
              </>
            ) : (
              <button 
                onClick={stopRecording}
                className="stop-button"
              >
                ⏹️ Stop
              </button>
            )}
          </div>
          
          {message && (
            <div className={`message ${message.includes('Error') || message.includes('not') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          
          {actionDetails && (
            <div className="action-confirmation">
              <h3>Confirm Action</h3>
              <p>{actionDetails.description}</p>
              
              <div className="action-buttons">
                <button 
                  onClick={confirmAction}
                  disabled={processing}
                  className="confirm-button"
                >
                  {processing ? 'Processing...' : 'Confirm'}
                </button>
                
                <button 
                  onClick={cancelAction}
                  disabled={processing}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {intentConfidence && (
            <div className="ai-details">
              <div className="ai-details-header">
                <h3>AI Speech Recognition Details</h3>
                <button onClick={() => setShowAIDetails(!showAIDetails)} className="toggle-button">
                  {showAIDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              {showAIDetails && (
                <div className="ai-details-content">
                  <div className="intent-confidence">
                    <h4>Intent Recognition</h4>
                    <div className="confidence-bar-container">
                      <div 
                        className="confidence-bar" 
                        style={{width: `${intentConfidence * 100}%`, backgroundColor: intentConfidence > 0.8 ? '#4caf50' : intentConfidence > 0.6 ? '#ff9800' : '#f44336'}}
                      ></div>
                    </div>
                    <p>Confidence: {(intentConfidence * 100).toFixed(1)}%</p>
                  </div>
                  
                  {recognizedEntities && Object.keys(recognizedEntities).length > 0 && (
                    <div className="entities">
                      <h4>Recognized Entities</h4>
                      <ul>
                        {Object.entries(recognizedEntities).map(([key, value]) => (
                          <li key={key}>
                            <strong>{key}:</strong> {value.toString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="nlp-explanation">
                    <h4>How It Works</h4>
                    <p>Our AI voice system uses Natural Language Processing to:</p>
                    <ol>
                      <li>Convert speech to text using advanced speech recognition</li>
                      <li>Classify your intent using a fine-tuned BERT model</li>
                      <li>Extract transaction details with Named Entity Recognition</li>
                      <li>Generate blockchain transactions from natural language</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="example-commands">
          <h4>Try saying or typing:</h4>
          <div className="examples-list">
            {exampleCommands.map((ex, index) => (
              <button 
                key={index} 
                className="example-button"
                onClick={() => {
                  setCommand(ex);
                  processCommand(ex);
                }}
                disabled={recording || processing}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        
        <div className="recent-commands">
          <h3>Recent Commands</h3>
          {recentCommands.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Command</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {recentCommands.map((cmd, index) => (
                  <tr key={index}>
                    <td>{cmd.command}</td>
                    <td>{new Date(cmd.timestamp).toLocaleString()}</td>
                    <td className={`status ${cmd.status.toLowerCase()}`}>{cmd.status}</td>
                    <td>{cmd.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No recent commands.</p>
          )}
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
        
        .voice-controls {
          background-color: #f5f5f5;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
        }
        
        .language-selector {
          margin-bottom: 1rem;
        }
        
        .language-selector select {
          margin-left: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid #ddd;
        }
        
        .command-input {
          display: flex;
          margin-bottom: 1rem;
          gap: 0.5rem;
        }
        
        .command-input-field {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
          font-size: 1rem;
        }
        
        button {
          cursor: pointer;
          border: none;
          border-radius: 0.25rem;
          padding: 0.5rem 1rem;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .record-button {
          background-color: #f44336;
          color: white;
        }
        
        .stop-button {
          background-color: #9e9e9e;
          color: white;
        }
        
        .submit-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          margin-left: 0.5rem;
          cursor: pointer;
        }
        
        .submit-button:hover {
          background-color: #303f9f;
        }
        
        .submit-button:disabled {
          background-color: #9fa8da;
          cursor: not-allowed;
        }
        
        .message {
          padding: 1rem;
          border-radius: 0.25rem;
          margin: 1rem 0;
        }
        
        .success {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .error {
          background-color: #ffebee;
          color: #c62828;
        }
        
        .action-confirmation {
          background-color: #e3f2fd;
          padding: 1rem;
          border-radius: 0.25rem;
          margin: 1rem 0;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .confirm-button {
          background-color: #4caf50;
          color: white;
        }
        
        .cancel-button {
          background-color: #f44336;
          color: white;
        }
        
        .ai-details {
          margin-top: 1.5rem;
          border: 1px solid #e0e0e0;
          border-radius: 0.25rem;
          padding: 1rem;
        }
        
        .ai-details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .toggle-button {
          background-color: #e0e0e0;
          color: #333;
        }
        
        .ai-details-content {
          margin-top: 1rem;
        }
        
        .confidence-bar-container {
          width: 100%;
          height: 1.5rem;
          background-color: #f5f5f5;
          border-radius: 0.25rem;
          overflow: hidden;
          margin: 0.5rem 0;
        }
        
        .confidence-bar {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .entities ul {
          list-style: none;
          padding: 0;
        }
        
        .entities li {
          padding: 0.5rem;
          background-color: #f5f5f5;
          margin: 0.25rem 0;
          border-radius: 0.25rem;
        }
        
        .example-commands {
          margin-top: 1.5rem;
          margin-bottom: 2rem;
          background-color: #f5f5f5;
          padding: 1rem;
          border-radius: 0.5rem;
        }
        
        .example-commands h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #1a237e;
        }
        
        .examples-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .example-button {
          padding: 0.5rem 0.75rem;
          background-color: #e0e0e0;
          border: 1px solid #ccc;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .example-button:hover {
          background-color: #d0d0d0;
        }
        
        .form-hint {
          display: block;
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.25rem;
        }
        
        .recent-commands {
          margin-top: 2rem;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #f5f5f5;
        }
        
        .status {
          font-weight: bold;
        }
        
        .status.completed {
          color: #2e7d32;
        }
        
        .status.pending {
          color: #f57c00;
        }
        
        .status.canceled {
          color: #c62828;
        }
        
        .nlp-explanation {
          background-color: #fff8e1;
          padding: 1rem;
          border-radius: 0.25rem;
          margin-top: 1rem;
        }
        
        .nlp-explanation ol {
          margin-top: 0.5rem;
          padding-left: 1.5rem;
        }
        
        .nlp-explanation li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
} 