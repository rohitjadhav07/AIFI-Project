// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIFiToken
 * @dev Simple ERC20 token for testing AIFi platform
 */
contract AIFiToken is ERC20, Ownable {
    uint8 private _decimals = 18;
    
    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor() ERC20("AIFi Token", "AIFI") {
        _mint(msg.sender, 1000000 * 10**_decimals); // Mint 1 million tokens
    }
    
    /**
     * @dev Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Function to mint tokens
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address to, uint256 amount) public onlyOwner returns (bool) {
        _mint(to, amount);
        return true;
    }
} 