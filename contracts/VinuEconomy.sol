// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract VinuEconomy {
    address public owner;
    // Official VinuChain Burn Address
    address public constant OFFICIAL_BURN_ADDRESS = address(0);
    
    uint256 public rewardPool;
    uint256 public burnPool; // "vinuDrop.burn" bucket
    uint256 public lastBurnTime;
    
    event ItemBought(address indexed buyer, string item, uint256 amount);
    event RewardsDistributed(uint256 amount, string period);
    event BurnExecuted(uint256 amount, uint256 timestamp);

    constructor() {
        owner = msg.sender;
        lastBurnTime = block.timestamp;
    }

    function buyItem(string memory item) external payable {
        require(msg.value > 0, "No payment sent");

        uint256 amount = msg.value;
        uint256 treasuryAmount = (amount * 60) / 100;
        uint256 burnPart = (amount * 20) / 100;
        // Remaining ~20% goes to reward pool
        uint256 rewardPart = amount - treasuryAmount - burnPart;

        // Treasury (sent immediately)
        payable(owner).transfer(treasuryAmount);
        
        // Accumulate in buckets (funds stay in contract)
        burnPool += burnPart;
        rewardPool += rewardPart;

        emit ItemBought(msg.sender, item, amount);
    }

    function getRewardPool() external view returns (uint256) {
        return rewardPool;
    }

    function getBurnPool() external view returns (uint256) {
        return burnPool;
    }

    // Weekly Burn Trigger
    function triggerWeeklyBurn() external {
        require(block.timestamp >= lastBurnTime + 7 days, "Burn cooldown active (1 week)");
        uint256 amount = burnPool;
        require(amount > 0, "No funds to burn");
        
        burnPool = 0;
        lastBurnTime = block.timestamp;
        
        (bool success, ) = payable(OFFICIAL_BURN_ADDRESS).call{value: amount}("");
        require(success, "Burn transfer failed");
        
        emit BurnExecuted(amount, block.timestamp);
    }

    // Distribute rewards to a specific recipient
    function distributeRewards(address payable recipient, uint256 percentage) external {
        require(msg.sender == owner, "Only owner");
        require(percentage <= 100, "Invalid percentage");
        require(recipient != address(0), "Invalid recipient");
        
        uint256 amount = (rewardPool * percentage) / 100;
        require(amount > 0, "No rewards to distribute");
        
        rewardPool -= amount;
        
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit RewardsDistributed(amount, "Manual Distribution");
    }
}
