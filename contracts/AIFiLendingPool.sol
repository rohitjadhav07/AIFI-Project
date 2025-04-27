// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title AIFiLendingPool
 * @dev Main lending pool contract for the AIFi protocol
 * Integrates with AI-driven risk assessment for dynamic interest rates
 */
contract AIFiLendingPool is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    
    // Risk tiers determined by AI model
    enum RiskTier { LOW, MEDIUM, HIGH }
    
    // Supported tokens/currencies
    mapping(address => bool) public supportedTokens;
    
    // Interest rate model per risk tier (annual basis points, e.g., 500 = 5%)
    mapping(RiskTier => uint256) public interestRates;
    
    // User deposits
    mapping(address => mapping(address => uint256)) public userDeposits; // user => token => amount
    
    // User loans
    struct Loan {
        uint256 amount;
        uint256 timestamp;
        RiskTier riskTier;
        bool active;
    }
    mapping(address => mapping(address => Loan)) public userLoans; // borrower => token => Loan
    
    // Total deposits per token
    mapping(address => uint256) public totalDeposits;
    
    // Protocol fee (in basis points, e.g., 50 = 0.5%)
    uint256 public protocolFee = 50;
    
    // Oracle contract for AI risk assessment
    address public riskAssessmentOracle;
    
    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event Borrow(address indexed user, address indexed token, uint256 amount, RiskTier riskTier);
    event Repay(address indexed user, address indexed token, uint256 amount, uint256 interest);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event InterestRateUpdated(RiskTier riskTier, uint256 newRate);
    event RiskOracleUpdated(address indexed newOracle);
    
    /**
     * @dev Constructor
     * @param _riskAssessmentOracle Address of the AI risk assessment oracle
     */
    constructor(address _riskAssessmentOracle) {
        riskAssessmentOracle = _riskAssessmentOracle;
        
        // Set default interest rates per risk tier (annual basis points)
        interestRates[RiskTier.LOW] = 500;    // 5%
        interestRates[RiskTier.MEDIUM] = 1000; // 10%
        interestRates[RiskTier.HIGH] = 1500;   // 15%
    }
    
    /**
     * @dev Add supported token
     * @param _token Address of the token
     */
    function addSupportedToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!supportedTokens[_token], "Token already supported");
        
        supportedTokens[_token] = true;
        emit TokenAdded(_token);
    }
    
    /**
     * @dev Remove supported token
     * @param _token Address of the token
     */
    function removeSupportedToken(address _token) external onlyOwner {
        require(supportedTokens[_token], "Token not supported");
        
        supportedTokens[_token] = false;
        emit TokenRemoved(_token);
    }
    
    /**
     * @dev Update interest rate for a risk tier
     * @param _riskTier Risk tier
     * @param _newRate New interest rate in basis points
     */
    function updateInterestRate(RiskTier _riskTier, uint256 _newRate) external onlyOwner {
        require(_newRate <= 5000, "Rate too high"); // Max 50%
        
        interestRates[_riskTier] = _newRate;
        emit InterestRateUpdated(_riskTier, _newRate);
    }
    
    /**
     * @dev Update risk assessment oracle
     * @param _newOracle Address of the new oracle
     */
    function updateRiskOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        
        riskAssessmentOracle = _newOracle;
        emit RiskOracleUpdated(_newOracle);
    }
    
    /**
     * @dev Deposit tokens into the lending pool
     * @param _token Address of the token
     * @param _amount Amount to deposit
     */
    function deposit(address _token, uint256 _amount) external nonReentrant {
        require(supportedTokens[_token], "Token not supported");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user to contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update user deposits and total deposits
        userDeposits[msg.sender][_token] = userDeposits[msg.sender][_token].add(_amount);
        totalDeposits[_token] = totalDeposits[_token].add(_amount);
        
        emit Deposit(msg.sender, _token, _amount);
    }
    
    /**
     * @dev Withdraw tokens from the lending pool
     * @param _token Address of the token
     * @param _amount Amount to withdraw
     */
    function withdraw(address _token, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(userDeposits[msg.sender][_token] >= _amount, "Insufficient balance");
        
        // Update user deposits and total deposits
        userDeposits[msg.sender][_token] = userDeposits[msg.sender][_token].sub(_amount);
        totalDeposits[_token] = totalDeposits[_token].sub(_amount);
        
        // Transfer tokens from contract to user
        IERC20(_token).safeTransfer(msg.sender, _amount);
        
        emit Withdraw(msg.sender, _token, _amount);
    }
    
    /**
     * @dev Borrow tokens from the lending pool
     * This function would integrate with the AI risk assessment oracle
     * @param _token Address of the token
     * @param _amount Amount to borrow
     */
    function borrow(address _token, uint256 _amount) external nonReentrant {
        require(supportedTokens[_token], "Token not supported");
        require(_amount > 0, "Amount must be greater than 0");
        require(totalDeposits[_token] >= _amount, "Insufficient liquidity");
        require(!userLoans[msg.sender][_token].active, "Existing loan active");
        
        // Get user risk tier from AI oracle (mock implementation for now)
        RiskTier riskTier = getRiskTierFromOracle(msg.sender);
        
        // Create loan
        userLoans[msg.sender][_token] = Loan({
            amount: _amount,
            timestamp: block.timestamp,
            riskTier: riskTier,
            active: true
        });
        
        // Update total deposits
        totalDeposits[_token] = totalDeposits[_token].sub(_amount);
        
        // Transfer tokens to borrower
        IERC20(_token).safeTransfer(msg.sender, _amount);
        
        emit Borrow(msg.sender, _token, _amount, riskTier);
    }
    
    /**
     * @dev Repay a loan with interest
     * @param _token Address of the token
     */
    function repay(address _token) external nonReentrant {
        Loan storage loan = userLoans[msg.sender][_token];
        require(loan.active, "No active loan");
        
        // Calculate interest based on risk tier and time elapsed
        uint256 timeElapsed = block.timestamp.sub(loan.timestamp);
        uint256 interest = calculateInterest(loan.amount, timeElapsed, loan.riskTier);
        uint256 totalRepayment = loan.amount.add(interest);
        
        // Check if user has sufficient balance
        require(IERC20(_token).balanceOf(msg.sender) >= totalRepayment, "Insufficient balance for repayment");
        
        // Transfer repayment amount from user to contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), totalRepayment);
        
        // Update total deposits (principal + interest)
        totalDeposits[_token] = totalDeposits[_token].add(totalRepayment);
        
        // Mark loan as inactive
        loan.active = false;
        
        emit Repay(msg.sender, _token, loan.amount, interest);
    }
    
    /**
     * @dev Calculate interest based on loan amount, time elapsed, and risk tier
     * @param _amount Loan amount
     * @param _timeElapsed Time elapsed in seconds
     * @param _riskTier Risk tier
     * @return Interest amount
     */
    function calculateInterest(uint256 _amount, uint256 _timeElapsed, RiskTier _riskTier) public view returns (uint256) {
        // Convert annual interest rate to per-second rate
        // interestRate is in basis points (1/100 of a percent)
        // 1 year = 31536000 seconds (365 days)
        uint256 annualRate = interestRates[_riskTier];
        uint256 perSecondRate = annualRate.mul(1e18).div(31536000).div(10000);
        
        // Calculate interest: amount * rate * timeElapsed
        uint256 interest = _amount.mul(perSecondRate).mul(_timeElapsed).div(1e18);
        
        return interest;
    }
    
    /**
     * @dev Mock implementation of getting risk tier from AI oracle
     * In a real implementation, this would call the oracle contract
     * @param _user User address
     * @return Risk tier
     */
    function getRiskTierFromOracle(address _user) internal view returns (RiskTier) {
        // This is a mock implementation
        // In production, this would make a call to the AI risk assessment oracle
        
        // For demonstration, return MEDIUM risk tier
        return RiskTier.MEDIUM;
    }
} 