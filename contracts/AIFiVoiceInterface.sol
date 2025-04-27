// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIFiVoiceInterface
 * @dev Contract that maps voice commands to function selectors
 * This contract serves as a registry for NLP-processed voice commands
 */
contract AIFiVoiceInterface is Ownable {
    // Struct to store action information
    struct ActionInfo {
        address targetContract;   // Contract to call
        bytes4 functionSelector;  // Function selector (first 4 bytes of function signature hash)
        string description;       // Human-readable description
        bool active;              // Whether the action is active
    }
    
    // Mapping from command hash to ActionInfo
    mapping(bytes32 => ActionInfo) public actions;
    
    // Supported languages
    mapping(string => bool) public supportedLanguages;
    
    // Authorized voice processors (external AI services)
    mapping(address => bool) public authorizedProcessors;
    
    // Events
    event ActionRegistered(bytes32 indexed commandHash, address targetContract, bytes4 functionSelector);
    event ActionUpdated(bytes32 indexed commandHash, address targetContract, bytes4 functionSelector);
    event ActionDeactivated(bytes32 indexed commandHash);
    event LanguageAdded(string language);
    event LanguageRemoved(string language);
    event ProcessorAuthorized(address indexed processor);
    event ProcessorRevoked(address indexed processor);
    
    /**
     * @dev Constructor
     */
    constructor() {
        // Add default supported languages
        supportedLanguages["en"] = true; // English
        supportedLanguages["es"] = true; // Spanish
        supportedLanguages["pt"] = true; // Portuguese
    }
    
    /**
     * @dev Modifier to restrict function calls to authorized processors
     */
    modifier onlyAuthorized() {
        require(authorizedProcessors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    /**
     * @dev Register a new voice command
     * @param _commandHash Hash of the command pattern
     * @param _targetContract Target contract address
     * @param _functionSelector Function selector to call
     * @param _description Human-readable description
     */
    function registerAction(
        bytes32 _commandHash,
        address _targetContract,
        bytes4 _functionSelector,
        string calldata _description
    ) external onlyOwner {
        require(_commandHash != bytes32(0), "Invalid command hash");
        require(_targetContract != address(0), "Invalid target contract");
        require(_functionSelector != bytes4(0), "Invalid function selector");
        require(bytes(_description).length > 0, "Invalid description");
        require(!actions[_commandHash].active, "Command already registered");
        
        actions[_commandHash] = ActionInfo({
            targetContract: _targetContract,
            functionSelector: _functionSelector,
            description: _description,
            active: true
        });
        
        emit ActionRegistered(_commandHash, _targetContract, _functionSelector);
    }
    
    /**
     * @dev Update an existing voice command
     * @param _commandHash Hash of the command pattern
     * @param _targetContract Target contract address
     * @param _functionSelector Function selector to call
     * @param _description Human-readable description
     */
    function updateAction(
        bytes32 _commandHash,
        address _targetContract,
        bytes4 _functionSelector,
        string calldata _description
    ) external onlyOwner {
        require(actions[_commandHash].active, "Command not registered");
        require(_targetContract != address(0), "Invalid target contract");
        require(_functionSelector != bytes4(0), "Invalid function selector");
        require(bytes(_description).length > 0, "Invalid description");
        
        actions[_commandHash].targetContract = _targetContract;
        actions[_commandHash].functionSelector = _functionSelector;
        actions[_commandHash].description = _description;
        
        emit ActionUpdated(_commandHash, _targetContract, _functionSelector);
    }
    
    /**
     * @dev Deactivate a voice command
     * @param _commandHash Hash of the command pattern
     */
    function deactivateAction(bytes32 _commandHash) external onlyOwner {
        require(actions[_commandHash].active, "Command not registered or already deactivated");
        
        actions[_commandHash].active = false;
        
        emit ActionDeactivated(_commandHash);
    }
    
    /**
     * @dev Add a supported language
     * @param _language Language code (e.g., "en", "es", "pt")
     */
    function addLanguage(string calldata _language) external onlyOwner {
        require(bytes(_language).length > 0, "Invalid language code");
        require(!supportedLanguages[_language], "Language already supported");
        
        supportedLanguages[_language] = true;
        
        emit LanguageAdded(_language);
    }
    
    /**
     * @dev Remove a supported language
     * @param _language Language code
     */
    function removeLanguage(string calldata _language) external onlyOwner {
        require(supportedLanguages[_language], "Language not supported");
        
        supportedLanguages[_language] = false;
        
        emit LanguageRemoved(_language);
    }
    
    /**
     * @dev Authorize a voice processor
     * @param _processor Processor address
     */
    function authorizeProcessor(address _processor) external onlyOwner {
        require(_processor != address(0), "Invalid processor address");
        require(!authorizedProcessors[_processor], "Already authorized");
        
        authorizedProcessors[_processor] = true;
        
        emit ProcessorAuthorized(_processor);
    }
    
    /**
     * @dev Revoke a processor's authorization
     * @param _processor Processor address
     */
    function revokeProcessor(address _processor) external onlyOwner {
        require(authorizedProcessors[_processor], "Not authorized");
        
        authorizedProcessors[_processor] = false;
        
        emit ProcessorRevoked(_processor);
    }
    
    /**
     * @dev Get action details by command hash
     * @param _commandHash Hash of the command pattern
     * @return targetContract Target contract address
     * @return functionSelector Function selector to call
     * @return description Human-readable description
     * @return active Whether the action is active
     */
    function getAction(bytes32 _commandHash) external view returns (
        address targetContract,
        bytes4 functionSelector,
        string memory description,
        bool active
    ) {
        ActionInfo storage actionInfo = actions[_commandHash];
        
        return (
            actionInfo.targetContract,
            actionInfo.functionSelector,
            actionInfo.description,
            actionInfo.active
        );
    }
    
    /**
     * @dev Process a voice command (called by authorized processor)
     * @param _commandHash Hash of the processed command
     * @return targetContract Target contract address
     * @return functionSelector Function selector to call
     */
    function processCommand(bytes32 _commandHash) external view onlyAuthorized returns (
        address targetContract,
        bytes4 functionSelector
    ) {
        ActionInfo storage actionInfo = actions[_commandHash];
        require(actionInfo.active, "Command not registered or inactive");
        
        return (actionInfo.targetContract, actionInfo.functionSelector);
    }
    
    /**
     * @dev Generate a command hash from a language and command string
     * @param _language Language code
     * @param _command Command string
     * @return Command hash
     */
    function generateCommandHash(string calldata _language, string calldata _command) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_language, ":", _command));
    }
} 