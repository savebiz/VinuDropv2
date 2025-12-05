// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract VinuEconomy {
    address public owner;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    uint256 public rewardPool;
    
    event ItemBought(address indexed buyer, string item, uint256 amount);
    event RewardsDistributed(uint256 amount, string period);

    constructor() {
        owner = msg.sender;
    }

    function buyItem(string memory item) external payable {
        require(msg.value > 0, "No payment sent");

        uint256 amount = msg.value;
        uint256 burnAmount = (amount * 25) / 100;
        uint256 treasuryAmount = (amount * 50) / 100;
        uint256 poolAmount = (amount * 25) / 100;

        // Burn
        payable(BURN_ADDRESS).transfer(burnAmount);
        
        // Treasury
        payable(owner).transfer(treasuryAmount);
        
        // Reward Pool (stays in contract)
        rewardPool += poolAmount;

        emit ItemBought(msg.sender, item, amount);
    }

    function getRewardPool() external view returns (uint256) {
        return rewardPool;
    }

    // Only owner can trigger distribution for now (simplified)
    function distributeRewards(uint256 percentage) external {
        require(msg.sender == owner, "Only owner");
        require(percentage <= 100, "Invalid percentage");
        
        uint256 amount = (rewardPool * percentage) / 100;
        rewardPool -= amount;
        
        // Logic to distribute 'amount' to winners would go here
        // For this MVP, we just emit an event and decrease the pool
        emit RewardsDistributed(amount, "Manual Distribution");
    }
}
