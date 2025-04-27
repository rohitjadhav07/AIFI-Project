/**
 * AI Services Integration for AIFi Frontend
 * 
 * This module provides interfaces to the AIFi AI services for the frontend,
 * including risk assessment, remittance optimization, and voice recognition.
 */

import { ethers } from 'ethers';
import contractUtils from './contracts';

/**
 * AI Risk Assessment Service
 * Interfaces with the backend risk assessment AI to provide credit scoring
 * and personalized lending terms.
 */
export class RiskAssessmentService {
  constructor() {
    this.apiEndpoint = process.env.RISK_ASSESSMENT_API || '/api/risk-assessment';
  }

  /**
   * Get a user's risk assessment based on their address and financial data
   * 
   * @param {string} userAddress - Ethereum address of the user
   * @param {Object} userData - Additional user financial data (optional)
   * @returns {Promise<Object>} Risk assessment results
   */
  async getUserRiskAssessment(userAddress, userData = {}) {
    try {
      // In a production environment, this would call the actual AI service
      // For demo purposes, we'll simulate a response

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data - in production would come from AI model
      const riskLevels = ['low', 'medium', 'high'];
      const riskLevel = riskLevels[Math.floor(Math.random() * 3)];
      
      // Calculate interest rate based on risk level
      let interestRate = 0.05; // Base rate 5%
      switch (riskLevel) {
        case 'low':
          interestRate += 0.02; // Additional 2%
          break;
        case 'medium':
          interestRate += 0.05; // Additional 5%
          break;
        case 'high':
          interestRate += 0.10; // Additional 10%
          break;
      }

      // Get onchain risk tier if available
      let onchainRiskTier = null;
      try {
        const { riskOracle } = await contractUtils.getContracts();
        onchainRiskTier = await riskOracle.getUserRiskTier(userAddress);
      } catch (error) {
        console.error('Error fetching on-chain risk tier:', error);
      }

      return {
        userAddress,
        riskLevel,
        interestRate,
        maxLoanAmount: ethers.utils.parseEther(riskLevel === 'high' ? '500' : (riskLevel === 'medium' ? '1000' : '2000')),
        onchainRiskTier,
        creditScore: 650 + Math.floor(Math.random() * 200),
        assessmentFactors: [
          {
            factor: 'Transaction History',
            importance: 0.35,
            score: 65 + Math.floor(Math.random() * 30)
          },
          {
            factor: 'Collateral Value',
            importance: 0.25,
            score: 70 + Math.floor(Math.random() * 30)
          },
          {
            factor: 'Repayment History',
            importance: 0.40,
            score: 75 + Math.floor(Math.random() * 25)
          }
        ],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in risk assessment:', error);
      throw new Error('Unable to complete risk assessment');
    }
  }

  /**
   * Get personalized advice to improve credit score
   * 
   * @param {string} userAddress - User's ethereum address
   * @returns {Promise<Object>} Personalized advice
   */
  async getPersonalizedAdvice(userAddress) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock recommendations - would come from AI in production
    return {
      recommendations: [
        {
          title: 'Increase Collateral',
          description: 'Add more collateral to improve your loan-to-value ratio.',
          potentialImpact: 'High',
          difficulty: 'Medium'
        },
        {
          title: 'Regular Deposits',
          description: 'Make regular deposits to demonstrate consistent income.',
          potentialImpact: 'Medium',
          difficulty: 'Low'
        },
        {
          title: 'Repay Existing Loans',
          description: 'Reduce your overall debt burden by repaying existing loans.',
          potentialImpact: 'High',
          difficulty: 'High'
        }
      ],
      estimatedImprovementTime: '2-3 months',
      potentialRateReduction: '3-5%'
    };
  }
}

/**
 * Remittance Optimization Service
 * Interfaces with the AI remittance optimizer to find the best
 * cross-border money transfer routes.
 */
export class RemittanceService {
  constructor() {
    this.apiEndpoint = process.env.REMITTANCE_API || '/api/remittance';
    this.countryCorridor = new Map();
    this.initializeCorridors();
  }

  /**
   * Initialize common remittance corridors with sample data
   */
  initializeCorridors() {
    // Sample corridors with synthetic data
    const corridors = [
      {
        source: 'United States',
        destination: 'Mexico',
        avgFeePercent: 1.8,
        avgTime: 5.5, // hours
        reliability: 98.5 // percent
      },
      {
        source: 'United States',
        destination: 'Philippines',
        avgFeePercent: 2.3,
        avgTime: 12.0,
        reliability: 97.0
      },
      {
        source: 'United States',
        destination: 'India',
        avgFeePercent: 2.1,
        avgTime: 24.0,
        reliability: 98.0
      },
      {
        source: 'European Union',
        destination: 'Nigeria',
        avgFeePercent: 3.5,
        avgTime: 36.0,
        reliability: 95.0
      },
      {
        source: 'United Kingdom',
        destination: 'India',
        avgFeePercent: 2.2,
        avgTime: 8.0,
        reliability: 97.5
      }
    ];

    // Add corridors to map for quick lookup
    corridors.forEach(corridor => {
      const key = `${corridor.source}:${corridor.destination}`;
      this.countryCorridor.set(key, corridor);
    });
  }

  /**
   * Get corridor statistics for a source-destination pair
   * 
   * @param {string} source - Source country
   * @param {string} destination - Destination country
   * @returns {Object|null} Corridor statistics or null if not found
   */
  getCorridorStats(source, destination) {
    const key = `${source}:${destination}`;
    return this.countryCorridor.get(key) || null;
  }

  /**
   * Find optimal remittance route between countries
   * 
   * @param {string} source - Source country
   * @param {string} destination - Destination country
   * @param {number} amount - Amount to send
   * @param {string} token - Token to use for remittance
   * @returns {Promise<Object>} Optimal route information
   */
  async findOptimalRoute(source, destination, amount, token = 'USDT') {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Check if direct corridor exists
      const directCorridor = this.getCorridorStats(source, destination);
      
      // Create result with direct path if available
      if (directCorridor) {
        const fee = amount * (directCorridor.avgFeePercent / 100);
        return {
          success: true,
          bestRoute: {
            path: [source, destination],
            fees: [fee],
            totalFee: fee,
            feePercent: directCorridor.avgFeePercent,
            estimatedTime: directCorridor.avgTime,
            reliability: directCorridor.reliability,
            providers: ['AIFi']
          },
          originalAmount: amount,
          amountReceived: amount - fee,
          sourceCountry: source,
          destinationCountry: destination,
          token
        };
      }

      // If no direct corridor, simulate an AI-generated multi-hop path
      // This would actually come from the AI model in production
      const intermediateCountry = 'United States';
      const firstHopFeePercent = 1.2;
      const secondHopFeePercent = 1.5;
      
      const firstHopFee = amount * (firstHopFeePercent / 100);
      const remainingAmount = amount - firstHopFee;
      const secondHopFee = remainingAmount * (secondHopFeePercent / 100);
      
      const totalFee = firstHopFee + secondHopFee;
      const totalFeePercent = (totalFee / amount) * 100;
      
      return {
        success: true,
        bestRoute: {
          path: [source, intermediateCountry, destination],
          fees: [firstHopFee, secondHopFee],
          totalFee: totalFee,
          feePercent: totalFeePercent,
          estimatedTime: 36.0, // hours
          reliability: 94.0, // percent
          providers: ['AIFi', 'Partner Network']
        },
        alternativeRoutes: [],
        originalAmount: amount,
        amountReceived: amount - totalFee,
        sourceCountry: source,
        destinationCountry: destination,
        token
      };
      
    } catch (error) {
      console.error('Error finding optimal route:', error);
      throw new Error('Unable to find remittance route');
    }
  }
}

/**
 * Voice Recognition Service
 * Interfaces with the NLP voice recognition system to process
 * voice commands for financial transactions.
 */
export class VoiceRecognitionService {
  constructor() {
    this.apiEndpoint = process.env.VOICE_API || '/api/voice';
    this.languages = ['en', 'es', 'pt'];
    this.currentLanguage = 'en';
  }

  /**
   * Set the language for voice recognition
   * 
   * @param {string} language - Language code (en, es, pt)
   * @returns {boolean} Success status
   */
  setLanguage(language) {
    if (this.languages.includes(language)) {
      this.currentLanguage = language;
      return true;
    }
    return false;
  }

  /**
   * Get example commands in the current language
   * 
   * @returns {string[]} List of example commands
   */
  getExampleCommands() {
    const examples = {
      en: [
        "Check my balance",
        "Send 100 AIFI to Alice",
        "Deposit 50 AIFI into the lending pool",
        "Withdraw 25 AIFI from the lending pool",
        "Borrow 200 AIFI from the lending pool",
        "Repay my AIFI loan",
        "Send 500 USDT from USA to Mexico",
        "What is the current interest rate?"
      ],
      es: [
        "Verificar mi saldo",
        "Enviar 100 AIFI a Alice",
        "Depositar 50 AIFI en el fondo de préstamos",
        "Retirar 25 AIFI del fondo de préstamos",
        "Pedir prestado 200 AIFI del fondo de préstamos",
        "Pagar mi préstamo de AIFI",
        "Enviar 500 USDT de USA a México",
        "¿Cuál es la tasa de interés actual?"
      ],
      pt: [
        "Verificar meu saldo",
        "Enviar 100 AIFI para Alice",
        "Depositar 50 AIFI no fundo de empréstimos",
        "Retirar 25 AIFI do fundo de empréstimos",
        "Pedir emprestado 200 AIFI do fundo de empréstimos",
        "Pagar meu empréstimo de AIFI",
        "Enviar 500 USDT dos EUA para o Brasil",
        "Qual é a taxa de juros atual?"
      ]
    };

    return examples[this.currentLanguage] || examples.en;
  }

  /**
   * Process a voice command
   * 
   * @param {string} command - Text of the voice command
   * @returns {Promise<Object>} Processed command result
   */
  async processCommand(command) {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // This would call the actual AI model in production
      // For demo, we'll detect common patterns
      
      // Simplified intent classification
      let intent, confidence, entities = {};
      const lowerCommand = command.toLowerCase();
      
      if (lowerCommand.includes('balance') || lowerCommand.includes('saldo')) {
        intent = 'check_balance';
        confidence = 0.95;
        entities = { token: 'aifi' };
      } 
      else if (lowerCommand.includes('send') || lowerCommand.includes('transfer') || lowerCommand.includes('enviar')) {
        intent = 'send_money';
        confidence = 0.92;
        
        // Extract amount
        const amountMatch = lowerCommand.match(/\d+/);
        const amount = amountMatch ? parseInt(amountMatch[0]) : 100;
        
        // Extract recipient
        let recipient = 'unknown';
        const toMatch = lowerCommand.match(/to\s+(\w+)/i);
        if (toMatch) {
          recipient = toMatch[1];
        }
        
        // Extract token
        let token = 'aifi';
        if (lowerCommand.includes('usdt') || lowerCommand.includes('tether')) {
          token = 'usdt';
        } else if (lowerCommand.includes('dai')) {
          token = 'dai';
        }
        
        entities = { amount, recipient, token };
        
        // Check for remittance case
        if (lowerCommand.includes('usa') || lowerCommand.includes('mexico') || 
            lowerCommand.includes('brazil') || lowerCommand.includes('india')) {
          let origin = 'United States';
          let destination = 'Mexico';
          
          if (lowerCommand.includes('brazil') || lowerCommand.includes('brasil')) {
            destination = 'Brazil';
          } else if (lowerCommand.includes('india')) {
            destination = 'India';
          }
          
          entities.origin_country = origin;
          entities.destination_country = destination;
        }
      }
      else if (lowerCommand.includes('deposit') || lowerCommand.includes('depositar')) {
        intent = 'deposit';
        confidence = 0.94;
        
        // Extract amount
        const amountMatch = lowerCommand.match(/\d+/);
        const amount = amountMatch ? parseInt(amountMatch[0]) : 50;
        
        // Extract token
        let token = 'aifi';
        if (lowerCommand.includes('usdt')) {
          token = 'usdt';
        }
        
        entities = { amount, token };
      }
      else if (lowerCommand.includes('withdraw') || lowerCommand.includes('retirar')) {
        intent = 'withdraw';
        confidence = 0.93;
        
        // Extract amount
        const amountMatch = lowerCommand.match(/\d+/);
        const amount = amountMatch ? parseInt(amountMatch[0]) : 25;
        
        // Extract token
        let token = 'aifi';
        if (lowerCommand.includes('usdt')) {
          token = 'usdt';
        }
        
        entities = { amount, token };
      }
      else if (lowerCommand.includes('borrow') || lowerCommand.includes('loan') || 
               lowerCommand.includes('prestar')) {
        intent = 'borrow';
        confidence = 0.90;
        
        // Extract amount
        const amountMatch = lowerCommand.match(/\d+/);
        const amount = amountMatch ? parseInt(amountMatch[0]) : 200;
        
        // Extract token
        let token = 'aifi';
        if (lowerCommand.includes('usdt')) {
          token = 'usdt';
        }
        
        entities = { amount, token };
      }
      else if (lowerCommand.includes('repay') || lowerCommand.includes('pay back') || 
               lowerCommand.includes('pagar')) {
        intent = 'repay';
        confidence = 0.95;
        
        // Extract token
        let token = 'aifi';
        if (lowerCommand.includes('usdt')) {
          token = 'usdt';
        }
        
        entities = { token };
      }
      else if (lowerCommand.includes('interest') || lowerCommand.includes('rate') || 
               lowerCommand.includes('tasa') || lowerCommand.includes('juros')) {
        intent = 'get_info';
        confidence = 0.90;
        entities = { topic: 'interest_rate' };
      }
      else {
        // Default fallback
        intent = 'unknown';
        confidence = 0.3;
        entities = {};
      }
      
      // Prepare transaction if intent is recognized
      let transaction = null;
      if (confidence > 0.6) {
        transaction = this._prepareTransaction(intent, entities);
      }
      
      return {
        success: confidence > 0.6,
        intent,
        confidence,
        entities,
        transaction,
        originalCommand: command,
        message: confidence > 0.6 ? null : "I'm not sure what you want to do. Please try again with a clearer command."
      };
      
    } catch (error) {
      console.error('Error processing voice command:', error);
      throw new Error('Unable to process voice command');
    }
  }
  
  /**
   * Prepare a transaction based on intent and entities
   * 
   * @param {string} intent - Classified intent
   * @param {Object} entities - Extracted entities
   * @returns {Object} Transaction details
   * @private
   */
  _prepareTransaction(intent, entities) {
    const tokenAddresses = {
      aifi: '0x1234567890123456789012345678901234567890',
      usdt: '0x4d5a316d23ebe168d8f887b4447bf8dbfa4901cc',
      dai: '0xcb46c0ddc60d18efeb0e586c17af6ea36452dae0'
    };
    
    const token = entities.token || 'aifi';
    const tokenAddress = tokenAddresses[token];
    
    switch (intent) {
      case 'check_balance':
        return {
          type: 'view',
          contract: 'token',
          function: 'balanceOf',
          params: [],
          description: `Check your ${token.toUpperCase()} balance`
        };
        
      case 'send_money':
        const recipient = entities.recipient || 'unknown';
        const amount = entities.amount || 0;
        
        if (entities.origin_country && entities.destination_country) {
          return {
            type: 'transaction',
            contract: 'remittance',
            function: 'initiateTransfer',
            params: [
              tokenAddress,
              ethers.utils.parseEther(amount.toString()),
              recipient,
              entities.origin_country,
              entities.destination_country
            ],
            description: `Send ${amount} ${token.toUpperCase()} to ${recipient} from ${entities.origin_country} to ${entities.destination_country}`
          };
        } else {
          return {
            type: 'transaction',
            contract: 'token',
            function: 'transfer',
            params: [
              recipient,
              ethers.utils.parseEther(amount.toString())
            ],
            description: `Send ${amount} ${token.toUpperCase()} to ${recipient}`
          };
        }
        
      case 'deposit':
        const depositAmount = entities.amount || 0;
        return {
          type: 'transaction',
          contract: 'lending_pool',
          function: 'deposit',
          params: [
            tokenAddress,
            ethers.utils.parseEther(depositAmount.toString())
          ],
          description: `Deposit ${depositAmount} ${token.toUpperCase()} into the lending pool`
        };
        
      case 'withdraw':
        const withdrawAmount = entities.amount || 0;
        return {
          type: 'transaction',
          contract: 'lending_pool',
          function: 'withdraw',
          params: [
            tokenAddress,
            ethers.utils.parseEther(withdrawAmount.toString())
          ],
          description: `Withdraw ${withdrawAmount} ${token.toUpperCase()} from the lending pool`
        };
        
      case 'borrow':
        const borrowAmount = entities.amount || 0;
        return {
          type: 'transaction',
          contract: 'lending_pool',
          function: 'borrow',
          params: [
            tokenAddress,
            ethers.utils.parseEther(borrowAmount.toString())
          ],
          description: `Borrow ${borrowAmount} ${token.toUpperCase()} from the lending pool`
        };
        
      case 'repay':
        return {
          type: 'transaction',
          contract: 'lending_pool',
          function: 'repay',
          params: [tokenAddress],
          description: `Repay your ${token.toUpperCase()} loan`
        };
        
      case 'get_info':
        return {
          type: 'info',
          topic: entities.topic || 'general',
          description: `Get information about ${entities.topic || token}`
        };
        
      default:
        return {
          type: 'error',
          description: 'Command not recognized'
        };
    }
  }

  /**
   * Get a transaction hash for a command from the voice interface contract
   * 
   * @param {string} command - Text of the voice command
   * @param {string} language - Language code
   * @returns {Promise<string>} Command hash
   */
  async getCommandHash(command, language = 'en') {
    try {
      const { voiceInterface } = await contractUtils.getContracts();
      return await voiceInterface.generateCommandHash(language, command);
    } catch (error) {
      console.error('Error generating command hash:', error);
      throw new Error('Unable to generate command hash');
    }
  }
}

// Default service instances
export const riskAssessment = new RiskAssessmentService();
export const remittance = new RemittanceService();
export const voiceRecognition = new VoiceRecognitionService();

// Export all services
export default {
  riskAssessment,
  remittance,
  voiceRecognition
}; 