// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title AIFiRemittance
 * @dev Smart remittance contract that uses AI to optimize cross-border transfers
 */
contract AIFiRemittance is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    
    // Supported tokens/stablecoins for remittance
    mapping(address => bool) public supportedTokens;
    
    // Fee structure for different corridors (origin => destination => fee basis points)
    // Fee is in basis points (1/100 of a percent), e.g., 50 = 0.5%
    mapping(string => mapping(string => uint256)) public corridorFees;
    
    // Default fee (in basis points) if specific corridor fee is not set
    uint256 public defaultFee = 50; // 0.5%
    
    // Minimum and maximum transfer amounts
    uint256 public minTransferAmount = 10 * 10**18; // $10 minimum (assuming 18 decimals)
    uint256 public maxTransferAmount = 10000 * 10**18; // $10,000 maximum
    
    // Transfer counter for generating unique transfer IDs
    uint256 private transferCounter;
    
    // Transfer status enum
    enum TransferStatus { PENDING, COMPLETED, CANCELLED }
    
    // Transfer struct
    struct Transfer {
        uint256 id;
        address sender;
        string recipientId; // External ID for recipient (could be phone number, email, etc.)
        address tokenAddress;
        uint256 amount;
        uint256 fee;
        string originCountry;
        string destinationCountry;
        uint256 timestamp;
        TransferStatus status;
    }
    
    // Mapping from transfer ID to Transfer struct
    mapping(uint256 => Transfer) public transfers;
    
    // Mapping from user address to their transfer IDs
    mapping(address => uint256[]) public userTransfers;
    
    // Treasury address for collecting fees
    address public treasury;
    
    // Events
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event CorridorFeeUpdated(string origin, string destination, uint256 fee);
    event DefaultFeeUpdated(uint256 fee);
    event TransferInitiated(uint256 indexed id, address indexed sender, string recipientId, address tokenAddress, uint256 amount, uint256 fee);
    event TransferCompleted(uint256 indexed id);
    event TransferCancelled(uint256 indexed id);
    event TreasuryUpdated(address indexed newTreasury);
    event TransferLimitsUpdated(uint256 minAmount, uint256 maxAmount);
    
    /**
     * @dev Constructor
     * @param _treasury Address of the treasury for collecting fees
     */
    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        transferCounter = 1;
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
     * @dev Update corridor fee
     * @param _origin Origin country code
     * @param _destination Destination country code
     * @param _fee Fee in basis points
     */
    function updateCorridorFee(string calldata _origin, string calldata _destination, uint256 _fee) external onlyOwner {
        require(bytes(_origin).length > 0, "Invalid origin");
        require(bytes(_destination).length > 0, "Invalid destination");
        require(_fee <= 500, "Fee too high"); // Max 5%
        
        corridorFees[_origin][_destination] = _fee;
        emit CorridorFeeUpdated(_origin, _destination, _fee);
    }
    
    /**
     * @dev Update default fee
     * @param _fee Fee in basis points
     */
    function updateDefaultFee(uint256 _fee) external onlyOwner {
        require(_fee <= 500, "Fee too high"); // Max 5%
        
        defaultFee = _fee;
        emit DefaultFeeUpdated(_fee);
    }
    
    /**
     * @dev Update transfer limits
     * @param _minAmount Minimum transfer amount
     * @param _maxAmount Maximum transfer amount
     */
    function updateTransferLimits(uint256 _minAmount, uint256 _maxAmount) external onlyOwner {
        require(_minAmount < _maxAmount, "Invalid limits");
        
        minTransferAmount = _minAmount;
        maxTransferAmount = _maxAmount;
        emit TransferLimitsUpdated(_minAmount, _maxAmount);
    }
    
    /**
     * @dev Update treasury address
     * @param _newTreasury New treasury address
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }
    
    /**
     * @dev Calculate fee for a specific corridor
     * @param _origin Origin country code
     * @param _destination Destination country code
     * @param _amount Transfer amount
     * @return Fee amount
     */
    function calculateFee(string calldata _origin, string calldata _destination, uint256 _amount) public view returns (uint256) {
        uint256 feeRate = corridorFees[_origin][_destination];
        
        // If specific corridor fee is not set, use default fee
        if (feeRate == 0) {
            feeRate = defaultFee;
        }
        
        // Calculate fee amount based on fee rate
        return _amount.mul(feeRate).div(10000);
    }
    
    /**
     * @dev Initiate a transfer
     * @param _tokenAddress Address of the token to transfer
     * @param _amount Amount to transfer
     * @param _recipientId External ID for the recipient
     * @param _originCountry Origin country code
     * @param _destinationCountry Destination country code
     * @return Transfer ID
     */
    function initiateTransfer(
        address _tokenAddress,
        uint256 _amount,
        string calldata _recipientId,
        string calldata _originCountry,
        string calldata _destinationCountry
    ) external nonReentrant returns (uint256) {
        require(supportedTokens[_tokenAddress], "Token not supported");
        require(_amount >= minTransferAmount, "Amount below minimum");
        require(_amount <= maxTransferAmount, "Amount above maximum");
        require(bytes(_recipientId).length > 0, "Invalid recipient ID");
        require(bytes(_originCountry).length > 0, "Invalid origin country");
        require(bytes(_destinationCountry).length > 0, "Invalid destination country");
        
        // Calculate fee
        uint256 fee = calculateFee(_originCountry, _destinationCountry, _amount);
        uint256 totalAmount = _amount.add(fee);
        
        // Check if sender has sufficient balance
        require(IERC20(_tokenAddress).balanceOf(msg.sender) >= totalAmount, "Insufficient balance");
        
        // Generate transfer ID
        uint256 transferId = transferCounter;
        transferCounter = transferCounter.add(1);
        
        // Create transfer record
        transfers[transferId] = Transfer({
            id: transferId,
            sender: msg.sender,
            recipientId: _recipientId,
            tokenAddress: _tokenAddress,
            amount: _amount,
            fee: fee,
            originCountry: _originCountry,
            destinationCountry: _destinationCountry,
            timestamp: block.timestamp,
            status: TransferStatus.PENDING
        });
        
        // Add transfer ID to user's transfers
        userTransfers[msg.sender].push(transferId);
        
        // Transfer tokens from sender to contract
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), totalAmount);
        
        // Transfer fee to treasury
        IERC20(_tokenAddress).safeTransfer(treasury, fee);
        
        emit TransferInitiated(transferId, msg.sender, _recipientId, _tokenAddress, _amount, fee);
        
        return transferId;
    }
    
    /**
     * @dev Complete a transfer (only callable by owner or authorized operator)
     * This would be called by the off-chain service after confirming recipient identity
     * @param _transferId Transfer ID
     */
    function completeTransfer(uint256 _transferId) external onlyOwner {
        Transfer storage transfer = transfers[_transferId];
        require(transfer.id == _transferId, "Transfer does not exist");
        require(transfer.status == TransferStatus.PENDING, "Transfer not pending");
        
        // Update transfer status
        transfer.status = TransferStatus.COMPLETED;
        
        // Note: The actual transfer to the recipient happens off-chain
        // This function only updates the status in the contract
        
        emit TransferCompleted(_transferId);
    }
    
    /**
     * @dev Cancel a transfer (can be called by sender or owner)
     * @param _transferId Transfer ID
     */
    function cancelTransfer(uint256 _transferId) external nonReentrant {
        Transfer storage transfer = transfers[_transferId];
        require(transfer.id == _transferId, "Transfer does not exist");
        require(transfer.status == TransferStatus.PENDING, "Transfer not pending");
        require(msg.sender == transfer.sender || msg.sender == owner(), "Not authorized");
        
        // Update transfer status
        transfer.status = TransferStatus.CANCELLED;
        
        // Return amount to sender (fee is not returned)
        IERC20(transfer.tokenAddress).safeTransfer(transfer.sender, transfer.amount);
        
        emit TransferCancelled(_transferId);
    }
    
    /**
     * @dev Get transfer details
     * @param _transferId Transfer ID
     * @return id Transfer ID
     * @return sender Sender address
     * @return recipientId Recipient ID
     * @return tokenAddress Token address
     * @return amount Transfer amount
     * @return fee Fee amount
     * @return originCountry Origin country
     * @return destinationCountry Destination country
     * @return timestamp Timestamp
     * @return status Transfer status
     */
    function getTransfer(uint256 _transferId) external view returns (
        uint256 id,
        address sender,
        string memory recipientId,
        address tokenAddress,
        uint256 amount,
        uint256 fee,
        string memory originCountry,
        string memory destinationCountry,
        uint256 timestamp,
        TransferStatus status
    ) {
        Transfer storage transfer = transfers[_transferId];
        require(transfer.id == _transferId, "Transfer does not exist");
        
        return (
            transfer.id,
            transfer.sender,
            transfer.recipientId,
            transfer.tokenAddress,
            transfer.amount,
            transfer.fee,
            transfer.originCountry,
            transfer.destinationCountry,
            transfer.timestamp,
            transfer.status
        );
    }
    
    /**
     * @dev Get user's transfers
     * @param _user User address
     * @return Array of transfer IDs
     */
    function getUserTransfers(address _user) external view returns (uint256[] memory) {
        return userTransfers[_user];
    }
} 