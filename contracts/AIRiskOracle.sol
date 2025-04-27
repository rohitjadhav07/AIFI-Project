// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAIRiskOracle.sol";

/**
 * @title AIRiskOracle
 * @dev Oracle contract that provides AI-based risk assessments
 * In a production environment, this would connect to an off-chain AI model
 */
contract AIRiskOracle is IAIRiskOracle, Ownable {
    // Risk tier values matching the values in the LendingPool
    enum RiskTier { LOW, MEDIUM, HIGH }
    
    // Mapping of user addresses to their risk tiers
    mapping(address => RiskTier) private userRiskTiers;
    
    // Authorized callers (e.g., lending pool contracts)
    mapping(address => bool) public authorizedCallers;
    
    // Off-chain AI oracle address that updates risk scores
    address public aiOracleUpdater;
    
    // Events
    event RiskTierUpdated(address indexed user, RiskTier riskTier);
    event AIUpdaterChanged(address indexed newUpdater);
    event CallerAuthorized(address indexed caller);
    event CallerRevoked(address indexed caller);
    
    /**
     * @dev Constructor
     * @param _aiOracleUpdater Address that will update risk scores from the AI model
     */
    constructor(address _aiOracleUpdater) {
        require(_aiOracleUpdater != address(0), "Invalid oracle updater address");
        aiOracleUpdater = _aiOracleUpdater;
    }
    
    /**
     * @dev Modifier to restrict function calls to authorized addresses
     */
    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    /**
     * @dev Modifier to restrict function calls to the AI oracle updater
     */
    modifier onlyOracleUpdater() {
        require(msg.sender == aiOracleUpdater, "Not oracle updater");
        _;
    }
    
    /**
     * @dev Change the AI oracle updater address
     * @param _newUpdater New updater address
     */
    function setAIOracleUpdater(address _newUpdater) external onlyOwner {
        require(_newUpdater != address(0), "Invalid oracle updater address");
        aiOracleUpdater = _newUpdater;
        emit AIUpdaterChanged(_newUpdater);
    }
    
    /**
     * @dev Authorize a caller to request risk assessments
     * @param _caller Address to authorize
     */
    function authorizeCaller(address _caller) external onlyOwner {
        require(_caller != address(0), "Invalid caller address");
        require(!authorizedCallers[_caller], "Already authorized");
        
        authorizedCallers[_caller] = true;
        emit CallerAuthorized(_caller);
    }
    
    /**
     * @dev Revoke a caller's authorization
     * @param _caller Address to revoke
     */
    function revokeCaller(address _caller) external onlyOwner {
        require(authorizedCallers[_caller], "Not authorized");
        
        authorizedCallers[_caller] = false;
        emit CallerRevoked(_caller);
    }
    
    /**
     * @dev Update a user's risk tier (called by the AI oracle updater)
     * In production, this would be called by an off-chain service that runs the AI model
     * @param _user User address
     * @param _riskTier Risk tier value
     */
    function updateRiskTier(address _user, RiskTier _riskTier) external onlyOracleUpdater {
        require(_user != address(0), "Invalid user address");
        
        userRiskTiers[_user] = _riskTier;
        emit RiskTierUpdated(_user, _riskTier);
    }
    
    /**
     * @dev Batch update risk tiers for multiple users
     * @param _users Array of user addresses
     * @param _riskTiers Array of risk tier values
     */
    function batchUpdateRiskTiers(address[] calldata _users, RiskTier[] calldata _riskTiers) external onlyOracleUpdater {
        require(_users.length == _riskTiers.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _users.length; i++) {
            require(_users[i] != address(0), "Invalid user address");
            
            userRiskTiers[_users[i]] = _riskTiers[i];
            emit RiskTierUpdated(_users[i], _riskTiers[i]);
        }
    }
    
    /**
     * @dev Get a user's risk assessment
     * @param _user User address
     * @return Risk tier value
     */
    function getRiskTier(address _user) external view override onlyAuthorized returns (uint8) {
        // If no risk tier has been set, default to MEDIUM
        if (_user == address(0) || userRiskTiers[_user] == RiskTier(0)) {
            return uint8(RiskTier.MEDIUM);
        }
        
        return uint8(userRiskTiers[_user]);
    }
    
    /**
     * @dev Public function to check risk tier (no authorization required)
     * @param _user User address
     * @return Risk tier as a string
     */
    function checkRiskTierPublic(address _user) external view returns (string memory) {
        if (_user == address(0) || userRiskTiers[_user] == RiskTier(0)) {
            return "MEDIUM";
        }
        
        RiskTier tier = userRiskTiers[_user];
        
        if (tier == RiskTier.LOW) {
            return "LOW";
        } else if (tier == RiskTier.MEDIUM) {
            return "MEDIUM";
        } else if (tier == RiskTier.HIGH) {
            return "HIGH";
        }
        
        return "UNKNOWN";
    }
} 