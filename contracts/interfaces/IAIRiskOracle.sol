// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title IAIRiskOracle
 * @dev Interface for the AI Risk Oracle contract
 */
interface IAIRiskOracle {
    /**
     * @dev Get a user's risk assessment
     * @param _user User address
     * @return Risk tier value
     */
    function getRiskTier(address _user) external view returns (uint8);
} 