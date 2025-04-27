"""
Voice Recognition and Natural Language Processing System for AIFi

This module implements a voice recognition system that processes
user commands and converts them into actionable blockchain transactions.
"""

import os
import json
import torch
import numpy as np
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    BertForTokenClassification,
    pipeline,
    AutoModelForSeq2SeqLM
)
from web3 import Web3
import logging
import re
from dotenv import load_dotenv
import torch.nn as nn
import torch.nn.functional as F

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class IntentClassifier:
    """
    Intent classification model for financial voice commands.
    Uses a pre-trained language model fine-tuned on financial transactions.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the intent classifier with a pre-trained model.
        
        Args:
            model_path: Path to the pre-trained model or model name from Hugging Face
        """
        # Use default model if no model path provided
        if not model_path:
            model_path = "bert-base-uncased"  # Can be replaced with financial domain-specific model
        
        # Load tokenizer and model from Hugging Face
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        # In a real implementation, this would be fine-tuned on financial commands
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_path, 
            num_labels=7  # Number of intent classes
        )
        
        # Define intent classes
        self.intent_classes = [
            "check_balance",
            "send_money",
            "deposit",
            "withdraw",
            "borrow",
            "repay",
            "get_info"
        ]
    
    def classify(self, text):
        """
        Classify the intent of the user's command.
        
        Args:
            text: User's voice command as text
            
        Returns:
            tuple: (intent_class, confidence_score)
        """
        # In a real implementation, this would use the fine-tuned model
        # Here we use a simplified rule-based approach for demonstration
        
        # Tokenize the input text
        inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128)
        
        # Get model prediction
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probabilities = F.softmax(logits, dim=1)
        
        # Get the predicted class and confidence
        predicted_class = torch.argmax(probabilities, dim=1).item()
        confidence = probabilities[0][predicted_class].item()
        
        # Rule-based fallback to improve accuracy for demo purposes
        # In production, this would be replaced by a well-trained model
        text = text.lower()
        if "balance" in text or "how much" in text:
            predicted_class = 0  # check_balance
            confidence = 0.95
        elif "send" in text or "transfer" in text or "remit" in text:
            predicted_class = 1  # send_money
            confidence = 0.95
        elif "deposit" in text or "put in" in text or "add" in text:
            predicted_class = 2  # deposit
            confidence = 0.95
        elif "withdraw" in text or "take out" in text or "get" in text:
            predicted_class = 3  # withdraw
            confidence = 0.95
        elif "borrow" in text or "loan" in text:
            predicted_class = 4  # borrow
            confidence = 0.95
        elif "repay" in text or "pay back" in text or "return" in text:
            predicted_class = 5  # repay
            confidence = 0.95
        elif "info" in text or "about" in text or "explain" in text or "what is" in text:
            predicted_class = 6  # get_info
            confidence = 0.90
        
        return self.intent_classes[predicted_class], confidence


class EntityExtractor:
    """
    Named Entity Recognition for financial transactions.
    Extracts entities like amount, recipient, token, etc. from voice commands.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the entity extractor with a pre-trained model.
        
        Args:
            model_path: Path to the pre-trained model or model name from Hugging Face
        """
        # Use default model if no model path provided
        if not model_path:
            model_path = "t5-base"  # Can be replaced with financial domain-specific model
        
        # Load tokenizer and model from Hugging Face
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        # In a real implementation, this would be fine-tuned on financial entities
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_path)
    
    def extract_entities(self, text, intent):
        """
        Extract entities from the user's command based on intent.
        
        Args:
            text: User's voice command as text
            intent: Classified intent
            
        Returns:
            dict: Dictionary of extracted entities
        """
        # In a real implementation, this would use a trained NER model
        # Here we use a simplified regex approach for demonstration
        entities = {}
        
        # Extract amounts (numbers followed by currency or token name)
        amount_patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:dollars|usd|rbtc|tokens|token|coins|coin|aifi)',
            r'(\d+(?:\.\d+)?)(?=\s+(?:to|from|into|in))',
            r'(\d+(?:\.\d+)?)'
        ]
        
        for pattern in amount_patterns:
            amount_match = re.search(pattern, text.lower())
            if amount_match:
                entities['amount'] = float(amount_match.group(1))
                break
        
        # Extract recipient/address (simplified for demo)
        recipient_patterns = [
            r'to\s+([a-zA-Z0-9]+)',
            r'(?:send|transfer|pay)(?:\s+\w+)*\s+to\s+([a-zA-Z0-9]+)',
            r'recipient(?:\s+is)?\s+([a-zA-Z0-9]+)'
        ]
        
        for pattern in recipient_patterns:
            recipient_match = re.search(pattern, text.lower())
            if recipient_match:
                entities['recipient'] = recipient_match.group(1)
                break
        
        # Extract token type
        token_patterns = [
            r'(aifi|rbtc|bitcoin|eth|ether|ethereum|usdt|usdc|dai|stablecoin)',
            r'in\s+(aifi|rbtc|bitcoin|eth|ether|ethereum|usdt|usdc|dai|stablecoin)'
        ]
        
        for pattern in token_patterns:
            token_match = re.search(pattern, text.lower())
            if token_match:
                token = token_match.group(1)
                # Normalize token names
                if token in ['bitcoin', 'btc']:
                    token = 'rbtc'
                elif token in ['ether', 'ethereum']:
                    token = 'eth'
                elif token in ['stablecoin']:
                    token = 'usdt'
                entities['token'] = token
                break
        
        # If token not specified, use default
        if 'token' not in entities:
            entities['token'] = 'aifi'
        
        # Extract additional entities based on intent
        if intent == "send_money":
            # Try to extract countries for remittance
            country_patterns = [
                r'from\s+([\w\s]+)(?:\s+to\s+)([\w\s]+)',
                r'(?:in|to)\s+([\w\s]+?)(?:\s+(?:from|to)\s+)([\w\s]+)'
            ]
            
            for pattern in country_patterns:
                country_match = re.search(pattern, text.lower())
                if country_match:
                    entities['origin_country'] = country_match.group(1).strip()
                    entities['destination_country'] = country_match.group(2).strip()
                    break
        
        # Set default values if not found
        if intent == "send_money" and 'recipient' not in entities:
            entities['recipient'] = "unknown"
        
        if intent in ["deposit", "withdraw", "borrow", "repay"] and 'amount' not in entities:
            entities['amount'] = 100.0  # Default amount
        
        return entities


class CommandExecutor:
    """
    Converts recognized intents and entities into smart contract calls.
    """
    
    def __init__(self, contract_addresses=None):
        """
        Initialize the command executor with contract addresses.
        
        Args:
            contract_addresses: Dictionary of contract addresses
        """
        # Load default addresses if none provided
        if not contract_addresses:
            self.contracts = {
                "lending_pool": os.getenv('LENDING_POOL_ADDRESS', "0xa0FA99EBB7dA508dFBB6e7DEe5aA02F7789D6aD3"),
                "remittance": os.getenv('REMITTANCE_ADDRESS', "0x2255bC87E8D6E56125793ab7Efd1D6b34023C92a"),
                "voice_interface": os.getenv('VOICE_INTERFACE_ADDRESS', "0xfb2Ee92e5C8AFA67d39c1A98D8ee89Faeae92EE2"),
                "token": os.getenv('TOKEN_ADDRESS', "0x1234567890123456789012345678901234567890")
            }
        else:
            self.contracts = contract_addresses
        
        # Token address mapping
        self.token_addresses = {
            "aifi": self.contracts["token"],
            "rbtc": "0x0000000000000000000000000000000000000000",  # Native RBTC
            "usdt": os.getenv('USDT_ADDRESS', "0x4d5a316d23ebe168d8f887b4447bf8dbfa4901cc"),
            "dai": os.getenv('DAI_ADDRESS', "0xcb46c0ddc60d18efeb0e586c17af6ea36452dae0"),
            "eth": os.getenv('ETH_ADDRESS', "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252")
        }
    
    def prepare_transaction(self, intent, entities):
        """
        Prepare a transaction based on the recognized intent and entities.
        
        Args:
            intent: Classified intent
            entities: Dictionary of extracted entities
            
        Returns:
            dict: Transaction details for frontend execution
        """
        # Get token address
        token = entities.get('token', 'aifi').lower()
        token_address = self.token_addresses.get(token, self.token_addresses['aifi'])
        
        # Prepare transaction based on intent
        if intent == "check_balance":
            return {
                "type": "view",
                "contract": "token",
                "function": "balanceOf",
                "params": [],
                "description": f"Check your {token.upper()} balance"
            }
        
        elif intent == "send_money":
            recipient = entities.get('recipient', 'unknown')
            amount = entities.get('amount', 0)
            
            # Check if this is a cross-border remittance
            if 'origin_country' in entities and 'destination_country' in entities:
                return {
                    "type": "transaction",
                    "contract": "remittance",
                    "function": "initiateTransfer",
                    "params": [
                        token_address,
                        Web3.toWei(amount, 'ether'),
                        recipient,
                        entities.get('origin_country', ''),
                        entities.get('destination_country', '')
                    ],
                    "description": f"Send {amount} {token.upper()} to {recipient} from {entities.get('origin_country', '')} to {entities.get('destination_country', '')}"
                }
            else:
                return {
                    "type": "transaction",
                    "contract": "token",
                    "function": "transfer",
                    "params": [
                        recipient,
                        Web3.toWei(amount, 'ether')
                    ],
                    "description": f"Send {amount} {token.upper()} to {recipient}"
                }
        
        elif intent == "deposit":
            amount = entities.get('amount', 0)
            return {
                "type": "transaction",
                "contract": "lending_pool",
                "function": "deposit",
                "params": [
                    token_address,
                    Web3.toWei(amount, 'ether')
                ],
                "description": f"Deposit {amount} {token.upper()} into the lending pool"
            }
        
        elif intent == "withdraw":
            amount = entities.get('amount', 0)
            return {
                "type": "transaction",
                "contract": "lending_pool",
                "function": "withdraw",
                "params": [
                    token_address,
                    Web3.toWei(amount, 'ether')
                ],
                "description": f"Withdraw {amount} {token.upper()} from the lending pool"
            }
        
        elif intent == "borrow":
            amount = entities.get('amount', 0)
            return {
                "type": "transaction",
                "contract": "lending_pool",
                "function": "borrow",
                "params": [
                    token_address,
                    Web3.toWei(amount, 'ether')
                ],
                "description": f"Borrow {amount} {token.upper()} from the lending pool"
            }
        
        elif intent == "repay":
            # For repay, we repay the full amount by default
            return {
                "type": "transaction",
                "contract": "lending_pool",
                "function": "repay",
                "params": [
                    token_address
                ],
                "description": f"Repay your {token.upper()} loan"
            }
        
        elif intent == "get_info":
            # This is a special case that doesn't require a transaction
            return {
                "type": "info",
                "topic": token if token in ["aifi", "lending", "remittance"] else "general",
                "description": f"Get information about {token}"
            }
        
        # Default case for unrecognized intent
        return {
            "type": "error",
            "description": "Command not recognized"
        }


class VoiceAssistant:
    """
    Main voice assistant that coordinates the voice recognition process.
    """
    
    def __init__(self):
        """Initialize the voice assistant components."""
        self.intent_classifier = IntentClassifier()
        self.entity_extractor = EntityExtractor()
        self.command_executor = CommandExecutor()
        
        # Supported languages
        self.languages = ["en", "es", "pt"]
        self.current_language = "en"
        
        # Translation prompts for multilingual support
        self.translation_prompts = {
            "es": "Traducir al inglés: ",
            "pt": "Traduzir para inglês: "
        }
    
    def process_command(self, text, language=None):
        """
        Process a voice command from text.
        
        Args:
            text: User's voice command as text
            language: Language of the command (default: English)
            
        Returns:
            dict: Response with transaction details
        """
        # Set language
        if language and language in self.languages:
            self.current_language = language
        
        # Translate if not in English
        if self.current_language != "en":
            # In a real implementation, this would use a translation model
            # Here we assume translation succeeded and continue with English
            # text = self.translate_to_english(text)
            pass
        
        # Classify intent
        intent, confidence = self.intent_classifier.classify(text)
        
        # If confidence is low, return error
        if confidence < 0.6:
            return {
                "success": False,
                "message": "I'm not sure what you want to do. Please try again with a clearer command."
            }
        
        # Extract entities
        entities = self.entity_extractor.extract_entities(text, intent)
        
        # Prepare transaction
        transaction = self.command_executor.prepare_transaction(intent, entities)
        
        # Return response
        return {
            "success": True,
            "intent": intent,
            "confidence": confidence,
            "entities": entities,
            "transaction": transaction,
            "original_command": text
        }
    
    def translate_to_english(self, text):
        """
        Translate text to English from the current language.
        
        Args:
            text: Text to translate
            
        Returns:
            str: Translated text
        """
        # In a real implementation, this would use a translation model
        # Here we return the original text
        return text
    
    def set_language(self, language):
        """
        Set the assistant's language.
        
        Args:
            language: Language code ("en", "es", "pt")
            
        Returns:
            bool: Success status
        """
        if language in self.languages:
            self.current_language = language
            return True
        return False
    
    def get_example_commands(self, language=None):
        """
        Get example commands in the specified language.
        
        Args:
            language: Language code (default: current language)
            
        Returns:
            list: Example commands
        """
        if not language:
            language = self.current_language
        
        # Example commands in English
        en_examples = [
            "Check my balance",
            "Send 100 AIFI to Alice",
            "Deposit 50 AIFI into the lending pool",
            "Withdraw 25 AIFI from the lending pool",
            "Borrow 200 AIFI from the lending pool",
            "Repay my AIFI loan",
            "Send 500 USDT from USA to Mexico",
            "What is the current interest rate?"
        ]
        
        # Example commands in Spanish
        es_examples = [
            "Verificar mi saldo",
            "Enviar 100 AIFI a Alice",
            "Depositar 50 AIFI en el fondo de préstamos",
            "Retirar 25 AIFI del fondo de préstamos",
            "Pedir prestado 200 AIFI del fondo de préstamos",
            "Pagar mi préstamo de AIFI",
            "Enviar 500 USDT de USA a México",
            "¿Cuál es la tasa de interés actual?"
        ]
        
        # Example commands in Portuguese
        pt_examples = [
            "Verificar meu saldo",
            "Enviar 100 AIFI para Alice",
            "Depositar 50 AIFI no fundo de empréstimos",
            "Retirar 25 AIFI do fundo de empréstimos",
            "Pedir emprestado 200 AIFI do fundo de empréstimos",
            "Pagar meu empréstimo de AIFI",
            "Enviar 500 USDT dos EUA para o Brasil",
            "Qual é a taxa de juros atual?"
        ]
        
        if language == "es":
            return es_examples
        elif language == "pt":
            return pt_examples
        else:
            return en_examples


# Example usage
if __name__ == "__main__":
    assistant = VoiceAssistant()
    
    # Test with different commands
    test_commands = [
        "Check my balance",
        "Send 100 AIFI to 0x1234",
        "Deposit 50 AIFI into the lending pool",
        "Withdraw 25 AIFI from the lending pool",
        "Borrow 200 AIFI from the lending pool",
        "Repay my AIFI loan",
        "Send 500 USDT from USA to Mexico for John",
        "What is the current interest rate?"
    ]
    
    for command in test_commands:
        print(f"\nCommand: {command}")
        response = assistant.process_command(command)
        print(f"Intent: {response['intent']} (Confidence: {response['confidence']:.2f})")
        print(f"Entities: {response['entities']}")
        print(f"Transaction: {response['transaction']['description']}")
        print(f"Contract: {response['transaction']['contract']}")
        print(f"Function: {response['transaction']['function']}")
        print(f"Params: {response['transaction']['params']}") 