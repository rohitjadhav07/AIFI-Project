"""
Setup script for AIFi AI models.
This script sets up the AI models to work with the deployed contracts.
"""

import os
import json
import argparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_risk_model(oracle_address, private_key=None):
    """
    Set up the risk assessment model with the deployed oracle address.
    """
    print(f"Setting up Risk Assessment Model with oracle at {oracle_address}")
    
    # Create .env file for risk assessment model
    env_content = f"""# AI Risk Assessment Model Environment
PROVIDER_URL={os.getenv('PROVIDER_URL', 'https://public-node.testnet.rsk.co')}
PRIVATE_KEY={private_key or os.getenv('PRIVATE_KEY', '')}
RISK_ORACLE_ADDRESS={oracle_address}
MODEL_PATH=./models/risk_model.pkl
"""
    
    with open("risk_model.env", "w") as f:
        f.write(env_content)
    
    print("Risk model environment created as risk_model.env")
    print("To run the risk model: python risk_assessment_model.py --env risk_model.env")

def setup_remittance_optimizer(contract_address, private_key=None):
    """
    Set up the remittance optimizer with the deployed remittance contract address.
    """
    print(f"Setting up Remittance Optimizer with contract at {contract_address}")
    
    # Create .env file for remittance optimizer
    env_content = f"""# AI Remittance Optimizer Environment
PROVIDER_URL={os.getenv('PROVIDER_URL', 'https://public-node.testnet.rsk.co')}
PRIVATE_KEY={private_key or os.getenv('PRIVATE_KEY', '')}
REMITTANCE_ADDRESS={contract_address}
MODEL_PATH=./models/remittance_optimizer.pkl
"""
    
    with open("remittance_model.env", "w") as f:
        f.write(env_content)
    
    print("Remittance optimizer environment created as remittance_model.env")
    print("To run the remittance optimizer: python remittance_optimizer.py --env remittance_model.env")

def setup_voice_recognition(contract_address, private_key=None):
    """
    Set up the voice recognition NLP with the deployed voice interface contract address.
    """
    print(f"Setting up Voice Recognition NLP with contract at {contract_address}")
    
    # Create .env file for voice recognition
    env_content = f"""# AI Voice Recognition Environment
PROVIDER_URL={os.getenv('PROVIDER_URL', 'https://public-node.testnet.rsk.co')}
PRIVATE_KEY={private_key or os.getenv('PRIVATE_KEY', '')}
VOICE_INTERFACE_ADDRESS={contract_address}
HUGGINGFACE_API_KEY={os.getenv('HUGGINGFACE_API_KEY', '')}
"""
    
    with open("voice_model.env", "w") as f:
        f.write(env_content)
    
    print("Voice recognition environment created as voice_model.env")
    print("To run the voice recognition: python voice_recognition.py --env voice_model.env")

def setup_all_models(deployment_file):
    """
    Set up all AI models based on the deployment file.
    """
    print(f"Loading deployment information from {deployment_file}")
    
    try:
        with open(deployment_file, 'r') as f:
            deployment_info = json.load(f)
    except Exception as e:
        print(f"Error loading deployment file: {e}")
        return
    
    # Extract contract addresses
    risk_oracle_address = deployment_info.get('contracts', {}).get('AIRiskOracle')
    lending_pool_address = deployment_info.get('contracts', {}).get('AIFiLendingPool')
    remittance_address = deployment_info.get('contracts', {}).get('AIFiRemittance')
    voice_interface_address = deployment_info.get('contracts', {}).get('AIFiVoiceInterface')
    
    # Create models directory if it doesn't exist
    if not os.path.exists("models"):
        os.makedirs("models")
        print("Created models directory")
    
    # Setup individual models
    private_key = os.getenv('PRIVATE_KEY', '')
    if risk_oracle_address:
        setup_risk_model(risk_oracle_address, private_key)
    
    if remittance_address:
        setup_remittance_optimizer(remittance_address, private_key)
    
    if voice_interface_address:
        setup_voice_recognition(voice_interface_address, private_key)
    
    print("\nAI model setup complete!")
    print("Make sure to install the required dependencies:")
    print("pip install -r requirements.txt")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Set up AIFi AI models")
    parser.add_argument("--deployment", default="../deployment-testnet.json",
                        help="Path to deployment info JSON file")
    args = parser.parse_args()
    
    setup_all_models(args.deployment) 