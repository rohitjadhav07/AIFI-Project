"""
Remittance Optimizer for AIFi

This module implements a reinforcement learning model that finds
optimal paths for cross-border remittances to minimize fees and transaction time.
"""

import numpy as np
import pandas as pd
import json
import requests
import time
from web3 import Web3
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import networkx as nx
from sklearn.ensemble import GradientBoostingRegressor
import random

# Load environment variables
load_dotenv()

# Define token trading pairs
TOKEN_PAIRS = [
    ('RBTC', 'DOC'),  # Dollar on Chain (RSK stablecoin)
    ('RBTC', 'RDOC'), # RIF Dollar on Chain
    ('RBTC', 'USDT'),
    ('RBTC', 'DAI'),
    ('RBTC', 'BRZ'),  # Brazilian stablecoin
    ('DOC', 'USDT'),
    ('DOC', 'DAI'),
    ('DOC', 'BRZ'),
    ('RDOC', 'DOC'),
    ('RDOC', 'USDT'),
    ('USDT', 'DAI'),
    ('USDT', 'BRZ'),
    ('DAI', 'BRZ')
]

# Define countries and their primary stablecoins
COUNTRY_TOKENS = {
    'ARG': ['DOC', 'RDOC', 'USDT'],
    'BRA': ['BRZ', 'USDT'],
    'MEX': ['USDT', 'DAI'],
    'COL': ['USDT', 'DAI'],
    'CHL': ['USDT', 'DOC'],
    'PER': ['USDT', 'DAI'],
    'USA': ['USDT', 'DAI'],
    'ESP': ['USDT', 'DAI']
}

class RemittanceOptimizer:
    """
    AI-powered remittance optimization system that finds the most cost-effective
    and efficient routes for cross-border payments using machine learning.
    """
    
    def __init__(self, corridor_data_path=None):
        """
        Initialize the remittance optimizer with corridor data
        
        Args:
            corridor_data_path: Path to JSON file with corridor data
        """
        # Base fee model for predicting transfer fees
        self.fee_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=3,
            random_state=42
        )
        
        # Initialize network graph for routing
        self.corridor_graph = nx.DiGraph()
        
        # Load corridor data or use default data
        if corridor_data_path and os.path.exists(corridor_data_path):
            with open(corridor_data_path, 'r') as f:
                self.corridor_data = json.load(f)
        else:
            # Use default corridor data
            self.corridor_data = self._generate_default_corridors()
        
        # Build the corridor graph
        self._build_corridor_graph()
        
        # Train the fee prediction model
        self._train_fee_model()
    
    def _generate_default_corridors(self):
        """Generate default corridor data for common remittance routes"""
        countries = [
            "United States", "Mexico", "India", "China", "Philippines", 
            "Nigeria", "United Kingdom", "Germany", "France", "Spain",
            "Brazil", "Colombia", "El Salvador", "Guatemala", "Honduras",
            "Canada", "Australia", "Japan", "South Korea", "Vietnam"
        ]
        
        corridors = []
        
        # Generate corridors with realistic properties
        for source in countries:
            for destination in countries:
                if source != destination:
                    # Not all country pairs have direct corridors
                    if random.random() < 0.7:
                        # Generate realistic corridor data
                        base_fee_percent = random.uniform(0.5, 3.0)
                        min_fee = random.uniform(1.0, 10.0)
                        max_fee = random.uniform(50.0, 200.0)
                        
                        # Some corridors have fixed fees instead of percentage
                        fee_type = random.choice(["percentage", "fixed"])
                        if fee_type == "fixed":
                            fixed_fee = random.uniform(5.0, 20.0)
                        else:
                            fixed_fee = 0.0
                        
                        # Average processing time in hours
                        avg_time = random.uniform(0.5, 48.0)
                        
                        # Reliability score (0-100)
                        reliability = random.uniform(70.0, 99.9)
                        
                        # Volume capacity per day in USD
                        volume_capacity = random.uniform(10000, 10000000)
                        
                        # Create corridor
                        corridor = {
                            "source": source,
                            "destination": destination,
                            "base_fee_percent": base_fee_percent,
                            "fixed_fee": fixed_fee,
                            "min_fee": min_fee,
                            "max_fee": max_fee,
                            "fee_type": fee_type,
                            "avg_time_hours": avg_time,
                            "reliability_score": reliability,
                            "volume_capacity": volume_capacity,
                            "currency_pairs": ["USD/USD", "USD/LOCAL", "LOCAL/LOCAL"],
                            "restrictions": [],
                            "providers": ["Bank", "MoneyTransfer", "Crypto"]
                        }
                        corridors.append(corridor)
        
        return {"corridors": corridors}
    
    def _build_corridor_graph(self):
        """Build a directed graph representing remittance corridors"""
        for corridor in self.corridor_data["corridors"]:
            source = corridor["source"]
            destination = corridor["destination"]
            
            # Add countries as nodes if they don't exist
            if not self.corridor_graph.has_node(source):
                self.corridor_graph.add_node(source)
            
            if not self.corridor_graph.has_node(destination):
                self.corridor_graph.add_node(destination)
            
            # Add edge with corridor properties
            self.corridor_graph.add_edge(
                source, 
                destination,
                **corridor
            )
    
    def _train_fee_model(self):
        """Train the fee prediction model with synthetic data"""
        # Create synthetic training data for fee prediction
        X_train = []
        y_train = []
        
        # Generate training samples
        for _ in range(5000):
            # Randomly select a corridor
            corridor = random.choice(self.corridor_data["corridors"])
            
            # Generate random transfer amount
            amount = random.uniform(10, 10000)
            
            # Time features
            hour_of_day = random.randint(0, 23)
            day_of_week = random.randint(0, 6)
            is_weekend = 1 if day_of_week >= 5 else 0
            
            # Provider type (0=Bank, 1=MoneyTransfer, 2=Crypto)
            provider_type = random.randint(0, 2)
            
            # Calculate actual fee based on corridor properties
            if corridor["fee_type"] == "percentage":
                fee = amount * (corridor["base_fee_percent"] / 100.0)
            else:
                fee = corridor["fixed_fee"]
            
            # Apply min/max constraints
            fee = max(fee, corridor["min_fee"])
            fee = min(fee, corridor["max_fee"])
            
            # Add some noise to simulate real-world variability
            fee *= random.uniform(0.95, 1.05)
            
            # Create feature vector
            features = [
                amount,
                corridor["base_fee_percent"],
                corridor["fixed_fee"],
                corridor["min_fee"],
                corridor["max_fee"],
                1 if corridor["fee_type"] == "percentage" else 0,
                corridor["avg_time_hours"],
                corridor["reliability_score"],
                hour_of_day,
                day_of_week,
                is_weekend,
                provider_type
            ]
            
            X_train.append(features)
            y_train.append(fee)
        
        # Train the model
        self.fee_model.fit(X_train, y_train)
    
    def predict_fee(self, source, destination, amount, provider_type="MoneyTransfer"):
        """
        Predict the fee for a remittance between two countries
        
        Args:
            source: Source country
            destination: Destination country
            amount: Transfer amount in USD
            provider_type: Type of provider ("Bank", "MoneyTransfer", "Crypto")
            
        Returns:
            Predicted fee in USD
        """
        # Check if direct corridor exists
        if not self.corridor_graph.has_edge(source, destination):
            return None
        
        # Get corridor properties
        corridor = self.corridor_graph.get_edge_data(source, destination)
        
        # Current time features
        now = datetime.datetime.now()
        hour_of_day = now.hour
        day_of_week = now.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        
        # Map provider type to numeric
        provider_map = {"Bank": 0, "MoneyTransfer": 1, "Crypto": 2}
        provider_numeric = provider_map.get(provider_type, 1)
        
        # Create feature vector for prediction
        features = [
            amount,
            corridor["base_fee_percent"],
            corridor["fixed_fee"],
            corridor["min_fee"],
            corridor["max_fee"],
            1 if corridor["fee_type"] == "percentage" else 0,
            corridor["avg_time_hours"],
            corridor["reliability_score"],
            hour_of_day,
            day_of_week,
            is_weekend,
            provider_numeric
        ]
        
        # Predict fee
        predicted_fee = self.fee_model.predict([features])[0]
        
        # Apply min/max constraints
        predicted_fee = max(predicted_fee, corridor["min_fee"])
        predicted_fee = min(predicted_fee, corridor["max_fee"])
        
        return predicted_fee
    
    def find_optimal_route(self, source, destination, amount, max_hops=2):
        """
        Find the optimal route for a remittance between two countries
        
        Args:
            source: Source country
            destination: Destination country
            amount: Transfer amount in USD
            max_hops: Maximum number of intermediate countries
            
        Returns:
            Dictionary with optimal route information
        """
        # Check if direct corridor exists
        direct_fee = self.predict_fee(source, destination, amount)
        
        best_routes = []
        
        # Direct route if available
        if direct_fee is not None:
            corridor = self.corridor_graph.get_edge_data(source, destination)
            direct_route = {
                "path": [source, destination],
                "fees": [direct_fee],
                "total_fee": direct_fee,
                "fee_percent": (direct_fee / amount) * 100,
                "estimated_time": corridor["avg_time_hours"],
                "reliability": corridor["reliability_score"],
                "providers": ["MoneyTransfer"]
            }
            best_routes.append(direct_route)
        
        # Find multi-hop routes
        if max_hops >= 1:
            # Find all simple paths between source and destination with max length
            simple_paths = list(nx.all_simple_paths(
                self.corridor_graph, 
                source=source, 
                target=destination, 
                cutoff=max_hops + 1  # +1 because path includes source and destination
            ))
            
            for path in simple_paths:
                if len(path) > 2:  # Only consider multi-hop paths
                    fees = []
                    total_time = 0
                    reliability = 100.0  # Start with perfect reliability
                    providers = []
                    
                    # Calculate fees and properties for each hop
                    remaining_amount = amount
                    for i in range(len(path) - 1):
                        hop_source = path[i]
                        hop_dest = path[i + 1]
                        
                        # Choose a provider for this hop
                        provider = "MoneyTransfer"  # Simplified for this example
                        providers.append(provider)
                        
                        hop_fee = self.predict_fee(hop_source, hop_dest, remaining_amount, provider)
                        if hop_fee is None:
                            break
                        
                        fees.append(hop_fee)
                        remaining_amount -= hop_fee
                        
                        # Accumulate time and reliability
                        corridor = self.corridor_graph.get_edge_data(hop_source, hop_dest)
                        total_time += corridor["avg_time_hours"]
                        reliability *= corridor["reliability_score"] / 100.0
                    
                    # Only consider valid complete paths
                    if len(fees) == len(path) - 1:
                        total_fee = sum(fees)
                        
                        route = {
                            "path": path,
                            "fees": fees,
                            "total_fee": total_fee,
                            "fee_percent": (total_fee / amount) * 100,
                            "estimated_time": total_time,
                            "reliability": reliability * 100.0,
                            "providers": providers
                        }
                        best_routes.append(route)
        
        # Sort routes by total fee
        best_routes.sort(key=lambda x: x["total_fee"])
        
        if not best_routes:
            return {
                "success": False,
                "message": "No valid routes found between these countries"
            }
        
        # Return the best routes
        return {
            "success": True,
            "best_route": best_routes[0],
            "alternative_routes": best_routes[1:3] if len(best_routes) > 1 else [],
            "original_amount": amount,
            "amount_received": amount - best_routes[0]["total_fee"],
            "source_country": source,
            "destination_country": destination
        }
    
    def get_transfer_stats(self, source, destination):
        """
        Get stats about transfers between source and destination
        
        Args:
            source: Source country
            destination: Destination country
            
        Returns:
            Dictionary with transfer statistics
        """
        if not self.corridor_graph.has_edge(source, destination):
            return {
                "success": False,
                "message": "No direct corridor between these countries"
            }
        
        corridor = self.corridor_graph.get_edge_data(source, destination)
        
        # Generate realistic example transfers
        example_amounts = [100, 500, 1000, 5000]
        examples = []
        
        for amount in example_amounts:
            fee = self.predict_fee(source, destination, amount)
            examples.append({
                "amount": amount,
                "fee": fee,
                "fee_percent": (fee / amount) * 100,
                "amount_received": amount - fee
            })
        
        return {
            "success": True,
            "corridor": f"{source} to {destination}",
            "avg_time_hours": corridor["avg_time_hours"],
            "reliability_score": corridor["reliability_score"],
            "fee_type": corridor["fee_type"],
            "base_fee_percent": corridor["base_fee_percent"] if corridor["fee_type"] == "percentage" else None,
            "fixed_fee": corridor["fixed_fee"] if corridor["fee_type"] == "fixed" else None,
            "min_fee": corridor["min_fee"],
            "max_fee": corridor["max_fee"],
            "examples": examples
        }


class RemittanceContract:
    """
    Interface to the AIFiRemittance smart contract.
    """
    
    def __init__(self, contract_address, abi_path, private_key=None, provider_url=None):
        """
        Initialize the contract interface.
        
        Args:
            contract_address (str): Remittance contract address
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
        print(f"Contract interface initialized with account: {self.account.address}")
    
    def initiate_transfer(self, token_address, amount, recipient_id, origin_country, destination_country):
        """
        Initiate a transfer using the AIFiRemittance contract.
        
        Args:
            token_address (str): Address of the token to transfer
            amount (int): Amount to transfer (in token's smallest unit)
            recipient_id (str): External ID for the recipient
            origin_country (str): Origin country code
            destination_country (str): Destination country code
            
        Returns:
            str: Transaction hash
        """
        # Build transaction
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        
        tx = self.contract.functions.initiateTransfer(
            token_address,
            amount,
            recipient_id,
            origin_country,
            destination_country
        ).build_transaction({
            'from': self.account.address,
            'gas': 300000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        print(f"Transfer initiated for recipient {recipient_id}")
        print(f"From {origin_country} to {destination_country}")
        print(f"Amount: {amount}")
        print(f"Transaction hash: {tx_hash.hex()}")
        
        return tx_hash.hex()


def main():
    """Main function to demonstrate remittance optimization."""
    print("AIFi Remittance Optimizer Demo")
    print("==============================")
    
    # Create and initialize optimizer
    optimizer = RemittanceOptimizer()
    
    # Example: Find optimal route from US to Philippines
    result = optimizer.find_optimal_route("United States", "Philippines", 1000)
    
    if result["success"]:
        best_route = result["best_route"]
        print(f"Best route: {' -> '.join(best_route['path'])}")
        print(f"Total fee: ${best_route['total_fee']:.2f} ({best_route['fee_percent']:.2f}%)")
        print(f"Amount received: ${result['amount_received']:.2f}")
        print(f"Estimated time: {best_route['estimated_time']:.1f} hours")
        print(f"Reliability: {best_route['reliability']:.2f}%")
    else:
        print(result["message"])
    
    # Get stats for a specific corridor
    stats = optimizer.get_transfer_stats("United States", "Mexico")
    
    if stats["success"]:
        print(f"\nStats for {stats['corridor']}:")
        print(f"Average time: {stats['avg_time_hours']:.1f} hours")
        print(f"Reliability: {stats['reliability_score']:.2f}%")
        print("Example transfers:")
        for ex in stats["examples"]:
            print(f"  ${ex['amount']}: Fee ${ex['fee']:.2f} ({ex['fee_percent']:.2f}%), Received ${ex['amount_received']:.2f}")
    else:
        print(stats["message"])
    
    # Save the model
    optimizer.save_model('remittance_model.json')
    
    print("\nDemo completed successfully!")


if __name__ == "__main__":
    main() 