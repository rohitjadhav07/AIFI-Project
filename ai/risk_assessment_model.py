"""
AI Risk Assessment Model for AIFi

This module implements a machine learning model for credit risk assessment
based on alternative financial data.
"""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import json
import time
from web3 import Web3
import os
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load environment variables
load_dotenv()

# Risk tier mapping
RISK_TIERS = {
    0: "LOW",
    1: "MEDIUM",
    2: "HIGH"
}

class AIFiRiskAssessmentModel:
    """
    ML model for credit risk assessment using alternative financial data.
    This model evaluates creditworthiness based on transaction history,
    behavioral patterns, and other non-traditional data points.
    """
    
    def __init__(self):
        """Initialize the risk assessment model."""
        self.model = None
        self.scaler = StandardScaler()
        self.features = [
            'avg_monthly_income', 
            'transaction_count_30d',
            'transaction_amount_30d',
            'largest_transaction',
            'smallest_transaction',
            'avg_transaction_size',
            'transaction_frequency',
            'savings_ratio',
            'regular_income_score',
            'device_score',
            'behavioral_score',
            'social_score',
            'geographic_score'
        ]
        
    def preprocess_data(self, data):
        """
        Preprocess raw data for model training or prediction.
        
        Args:
            data (DataFrame): Raw user financial data
            
        Returns:
            DataFrame: Preprocessed data ready for the model
        """
        # Handle missing values
        for feature in self.features:
            if feature in data.columns:
                data[feature] = data[feature].fillna(data[feature].median())
        
        # Normalize numerical features
        numerical_features = [f for f in self.features if f in data.columns]
        if len(numerical_features) > 0:
            data[numerical_features] = self.scaler.fit_transform(data[numerical_features])
        
        return data
    
    def train(self, training_data, labels):
        """
        Train the risk assessment model.
        
        Args:
            training_data (DataFrame): User financial data for training
            labels (Series): Risk classification labels
            
        Returns:
            float: Model accuracy score
        """
        # Preprocess training data
        processed_data = self.preprocess_data(training_data)
        
        # Split into training and validation sets
        X_train, X_val, y_train, y_val = train_test_split(
            processed_data, labels, test_size=0.2, random_state=42
        )
        
        # Train XGBoost model
        self.model = xgb.XGBClassifier(
            objective='multi:softmax',
            num_class=3,  # LOW, MEDIUM, HIGH risk tiers
            learning_rate=0.1,
            max_depth=5,
            n_estimators=100,
            subsample=0.8,
            colsample_bytree=0.8
        )
        
        self.model.fit(
            X_train, 
            y_train,
            eval_set=[(X_val, y_val)],
            eval_metric='mlogloss',
            early_stopping_rounds=10,
            verbose=False
        )
        
        # Evaluate model
        predictions = self.model.predict(X_val)
        accuracy = accuracy_score(y_val, predictions)
        
        print(f"Model trained with accuracy: {accuracy:.4f}")
        print(f"Precision: {precision_score(y_val, predictions, average='weighted'):.4f}")
        print(f"Recall: {recall_score(y_val, predictions, average='weighted'):.4f}")
        print(f"F1 Score: {f1_score(y_val, predictions, average='weighted'):.4f}")
        
        return accuracy
    
    def predict_risk_tier(self, user_data):
        """
        Predict risk tier for a user based on their financial data.
        
        Args:
            user_data (dict): User's financial data
            
        Returns:
            str: Risk tier (LOW, MEDIUM, HIGH)
            float: Confidence score (0-1)
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Convert dict to DataFrame
        user_df = pd.DataFrame([user_data])
        
        # Preprocess data
        processed_data = self.preprocess_data(user_df)
        
        # Make prediction
        risk_tier_idx = self.model.predict(processed_data)[0]
        probabilities = self.model.predict_proba(processed_data)[0]
        confidence = probabilities[risk_tier_idx]
        
        return RISK_TIERS[risk_tier_idx], confidence
    
    def save_model(self, filepath):
        """Save model to file."""
        if self.model is not None:
            self.model.save_model(filepath)
            print(f"Model saved to {filepath}")
        else:
            print("No model to save. Train the model first.")
    
    def load_model(self, filepath):
        """Load model from file."""
        self.model = xgb.XGBClassifier()
        self.model.load_model(filepath)
        print(f"Model loaded from {filepath}")


class BlockchainOracle:
    """
    Oracle service that updates user risk tiers on the blockchain.
    """
    
    def __init__(self, contract_address, abi_path, private_key=None, provider_url=None):
        """
        Initialize the blockchain oracle.
        
        Args:
            contract_address (str): Risk oracle contract address
            abi_path (str): Path to the contract ABI file
            private_key (str, optional): Private key for signing transactions
            provider_url (str, optional): Web3 provider URL
        """
        # Use environment variables if not provided
        self.private_key = private_key or os.getenv('PRIVATE_KEY')
        self.provider_url = provider_url or os.getenv('PROVIDER_URL')
        
        # Connect to blockchain
        self.w3 = Web3(Web3.HTTPProvider(self.provider_url))
        
        # Load contract ABI
        with open(abi_path, 'r') as abi_file:
            contract_abi = json.load(abi_file)
        
        # Create contract instance
        self.contract = self.w3.eth.contract(
            address=contract_address,
            abi=contract_abi
        )
        
        # Set up account
        self.account = self.w3.eth.account.from_key(self.private_key)
        print(f"Oracle initialized with account: {self.account.address}")
    
    def update_risk_tier(self, user_address, risk_tier):
        """
        Update a user's risk tier on the blockchain.
        
        Args:
            user_address (str): User's blockchain address
            risk_tier (str): Risk tier (LOW, MEDIUM, HIGH)
            
        Returns:
            str: Transaction hash
        """
        # Convert risk tier to integer
        risk_tier_map = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
        risk_tier_int = risk_tier_map.get(risk_tier, 1)  # Default to MEDIUM
        
        # Build transaction
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        
        tx = self.contract.functions.updateRiskTier(
            user_address,
            risk_tier_int
        ).build_transaction({
            'from': self.account.address,
            'gas': 200000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        print(f"Risk tier updated for {user_address}: {risk_tier}")
        print(f"Transaction hash: {tx_hash.hex()}")
        
        return tx_hash.hex()
    
    def batch_update_risk_tiers(self, user_data):
        """
        Update risk tiers for multiple users in a single transaction.
        
        Args:
            user_data (list): List of (user_address, risk_tier) tuples
            
        Returns:
            str: Transaction hash
        """
        # Convert risk tiers to integers
        risk_tier_map = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
        
        addresses = []
        risk_tiers = []
        
        for address, tier in user_data:
            addresses.append(address)
            risk_tiers.append(risk_tier_map.get(tier, 1))  # Default to MEDIUM
        
        # Build transaction
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        
        tx = self.contract.functions.batchUpdateRiskTiers(
            addresses,
            risk_tiers
        ).build_transaction({
            'from': self.account.address,
            'gas': 500000,  # Higher gas limit for batch operation
            'gasPrice': self.w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        print(f"Batch updated {len(addresses)} risk tiers")
        print(f"Transaction hash: {tx_hash.hex()}")
        
        return tx_hash.hex()


def generate_synthetic_data(num_samples=1000):
    """
    Generate synthetic data for model training.
    
    Args:
        num_samples (int): Number of samples to generate
        
    Returns:
        tuple: (DataFrame of features, Series of labels)
    """
    np.random.seed(42)
    
    # Generate random features
    data = {
        'avg_monthly_income': np.random.normal(3000, 1500, num_samples),
        'transaction_count_30d': np.random.randint(1, 100, num_samples),
        'transaction_amount_30d': np.random.normal(2000, 1000, num_samples),
        'largest_transaction': np.random.normal(1000, 500, num_samples),
        'smallest_transaction': np.random.normal(10, 5, num_samples),
        'avg_transaction_size': np.random.normal(150, 100, num_samples),
        'transaction_frequency': np.random.normal(0.7, 0.2, num_samples),
        'savings_ratio': np.random.normal(0.2, 0.1, num_samples),
        'regular_income_score': np.random.normal(0.7, 0.2, num_samples),
        'device_score': np.random.normal(0.8, 0.1, num_samples),
        'behavioral_score': np.random.normal(0.75, 0.15, num_samples),
        'social_score': np.random.normal(0.6, 0.2, num_samples),
        'geographic_score': np.random.normal(0.5, 0.3, num_samples)
    }
    
    # Ensure values are reasonable
    for key in data:
        if key.endswith('_ratio') or key.endswith('_score') or key == 'transaction_frequency':
            data[key] = np.clip(data[key], 0, 1)
        else:
            data[key] = np.maximum(data[key], 0)
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Generate risk tiers (0=LOW, 1=MEDIUM, 2=HIGH)
    # This is a simplified rule-based approach for synthetic data
    def assign_risk_tier(row):
        income_score = row['avg_monthly_income'] / 5000
        transaction_score = row['transaction_count_30d'] / 100
        behavioral_score = row['behavioral_score']
        
        total_score = (income_score * 0.4 + transaction_score * 0.3 + behavioral_score * 0.3)
        
        if total_score > 0.7:
            return 0  # LOW risk
        elif total_score > 0.4:
            return 1  # MEDIUM risk
        else:
            return 2  # HIGH risk
    
    labels = df.apply(assign_risk_tier, axis=1)
    
    return df, labels


def main():
    """Main function to demonstrate model training and oracle interaction."""
    print("AIFi Risk Assessment Model Demo")
    print("===============================")
    
    # Create and train model
    model = AIFiRiskAssessmentModel()
    print("Generating synthetic training data...")
    training_data, labels = generate_synthetic_data(num_samples=5000)
    
    print("\nTraining model...")
    model.train(training_data, labels)
    
    # Save model
    model.save_model('risk_model.json')
    
    # Example prediction
    test_user = {
        'avg_monthly_income': 4500,
        'transaction_count_30d': 45,
        'transaction_amount_30d': 3200,
        'largest_transaction': 1200,
        'smallest_transaction': 15,
        'avg_transaction_size': 180,
        'transaction_frequency': 0.8,
        'savings_ratio': 0.25,
        'regular_income_score': 0.85,
        'device_score': 0.9,
        'behavioral_score': 0.82,
        'social_score': 0.7,
        'geographic_score': 0.6
    }
    
    risk_tier, confidence = model.predict_risk_tier(test_user)
    print(f"\nSample prediction: Risk tier = {risk_tier}, Confidence = {confidence:.2f}")
    
    # Example of blockchain oracle interaction (commented out as it requires actual credentials)
    """
    print("\nInitializing blockchain oracle...")
    oracle = BlockchainOracle(
        contract_address="0x...",  # AIRiskOracle contract address
        abi_path="AIRiskOracle.json"
    )
    
    # Update a single user's risk tier
    tx_hash = oracle.update_risk_tier(
        user_address="0x...",  # User's address
        risk_tier=risk_tier
    )
    
    # Batch update example
    batch_data = [
        ("0x...", "LOW"),
        ("0x...", "MEDIUM"),
        ("0x...", "HIGH")
    ]
    batch_tx_hash = oracle.batch_update_risk_tiers(batch_data)
    """


class AIRiskAssessmentModel:
    """
    AI Risk Assessment Model that evaluates borrower risk profiles
    using machine learning to calculate personalized interest rates.
    """
    
    def __init__(self, model_path=None):
        """Initialize the risk assessment model"""
        self.features = [
            'credit_score', 
            'income', 
            'debt_to_income_ratio',
            'loan_amount',
            'collateral_value',
            'transaction_history_score',
            'repayment_history_score',
            'account_age_days'
        ]
        
        if model_path and os.path.exists(model_path):
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(f"{os.path.splitext(model_path)[0]}_scaler.pkl")
        else:
            # Create a new model if no existing model is loaded
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
            self.scaler = StandardScaler()
            # Pre-train with sample data
            self._pretrain_model()
    
    def _pretrain_model(self):
        """Pre-train model with synthetic data to simulate a trained model"""
        # Generate synthetic training data
        np.random.seed(42)
        n_samples = 1000
        
        # Create synthetic features with realistic values
        credit_scores = np.random.normal(680, 75, n_samples).clip(300, 850)
        income = np.random.lognormal(10.5, 0.7, n_samples)  # Income in USD
        debt_ratio = np.random.beta(2, 5, n_samples) * 0.6  # Debt to income ratio
        loan_amounts = np.random.lognormal(9, 1, n_samples)  # Loan amount in USD
        collateral = loan_amounts * np.random.normal(1.5, 0.3, n_samples).clip(0.8, 3)  # Collateral value
        tx_history = np.random.normal(70, 15, n_samples).clip(0, 100)  # Transaction history score
        repayment_history = np.random.normal(75, 20, n_samples).clip(0, 100)  # Repayment history score
        account_age = np.random.gamma(5, 100, n_samples)  # Account age in days
        
        # Create feature matrix
        X = np.column_stack([
            credit_scores, income, debt_ratio, loan_amounts, 
            collateral, tx_history, repayment_history, account_age
        ])
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Generate risk scores (target) based on features
        # Higher score = lower risk
        risk_weights = [-0.4, 0.2, -0.5, -0.3, 0.4, 0.2, 0.4, 0.2]
        risk_scores = np.dot(X_scaled, risk_weights) + np.random.normal(0, 0.2, n_samples)
        
        # Convert to risk class (0=high risk, 1=medium risk, 2=low risk)
        risk_classes = pd.qcut(risk_scores, 3, labels=[0, 1, 2]).astype(int)
        
        # Train the model
        self.model.fit(X_scaled, risk_classes)
    
    def save_model(self, model_path):
        """Save the trained model for future use"""
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, f"{os.path.splitext(model_path)[0]}_scaler.pkl")
        print(f"Model saved to {model_path}")
    
    def assess_risk(self, user_data):
        """
        Assess the risk level of a borrower based on their financial profile
        
        Args:
            user_data: Dictionary containing user financial information
            
        Returns:
            Dictionary with risk assessment results including:
            - risk_level: 'high', 'medium', or 'low'
            - interest_rate: Personalized interest rate
            - max_loan_amount: Maximum recommended loan amount
            - risk_score: Numerical score representing risk (0-100)
        """
        # Extract and prepare features
        features = []
        for feature in self.features:
            if feature in user_data:
                features.append(user_data[feature])
            else:
                # Use default values for missing features
                if feature == 'credit_score':
                    features.append(650)
                elif feature == 'income':
                    features.append(50000)
                elif feature == 'debt_to_income_ratio':
                    features.append(0.3)
                elif feature == 'loan_amount':
                    features.append(10000)
                elif feature == 'collateral_value':
                    features.append(15000)
                elif feature == 'transaction_history_score':
                    features.append(70)
                elif feature == 'repayment_history_score':
                    features.append(75)
                elif feature == 'account_age_days':
                    features.append(180)
        
        # Scale features
        features_scaled = self.scaler.transform([features])
        
        # Predict risk class
        risk_class = self.model.predict(features_scaled)[0]
        
        # Get prediction probabilities for each class
        risk_probs = self.model.predict_proba(features_scaled)[0]
        
        # Calculate risk score (0-100), higher is less risky
        risk_score = risk_probs[2] * 100
        
        # Map risk class to risk level
        risk_levels = {0: 'high', 1: 'medium', 2: 'low'}
        risk_level = risk_levels[risk_class]
        
        # Calculate personalized interest rate based on risk
        # Base rate (e.g., 5%) + risk premium
        base_rate = 0.05  # 5%
        if risk_level == 'high':
            interest_rate = base_rate + 0.10  # Additional 10%
            ltv_ratio = 0.5  # Loan-to-value ratio for high risk
        elif risk_level == 'medium':
            interest_rate = base_rate + 0.05  # Additional 5%
            ltv_ratio = 0.7  # Loan-to-value ratio for medium risk
        else:  # low risk
            interest_rate = base_rate + 0.02  # Additional 2%
            ltv_ratio = 0.8  # Loan-to-value ratio for low risk
        
        # Calculate maximum loan amount based on collateral and risk
        collateral = user_data.get('collateral_value', 0)
        max_loan_amount = collateral * ltv_ratio
        
        return {
            'risk_level': risk_level,
            'interest_rate': interest_rate,
            'max_loan_amount': max_loan_amount,
            'risk_score': risk_score
        }
    
    def explain_assessment(self, user_data):
        """
        Provide an explanation of the risk assessment
        
        Args:
            user_data: Dictionary containing user financial information
            
        Returns:
            Dictionary with feature importance and explanation
        """
        # Get feature importance from the model
        feature_importance = self.model.feature_importances_
        
        # Create a dictionary of feature importance
        importance_dict = {feature: importance for feature, importance 
                          in zip(self.features, feature_importance)}
        
        # Sort features by importance
        sorted_features = sorted(importance_dict.items(), 
                                key=lambda x: x[1], reverse=True)
        
        # Generate explanation
        explanation = "Your risk assessment is based on the following factors:\n"
        for feature, importance in sorted_features[:3]:  # Top 3 factors
            readable_feature = feature.replace('_', ' ').title()
            explanation += f"- {readable_feature}: {importance*100:.1f}% importance\n"
        
        # Add personalized advice
        assessment = self.assess_risk(user_data)
        if assessment['risk_level'] == 'high':
            explanation += "\nTo improve your assessment, consider:\n"
            explanation += "- Increasing your collateral value\n"
            explanation += "- Improving your credit score\n"
            explanation += "- Reducing your debt-to-income ratio"
        
        return {
            'feature_importance': dict(sorted_features),
            'explanation': explanation,
            'assessment': assessment
        }


if __name__ == "__main__":
    main() 