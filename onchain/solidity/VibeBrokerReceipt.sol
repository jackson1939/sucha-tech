// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VibeBrokerReceipt {
    struct Receipt {
        address user;
        string  tokenFrom;
        string  tokenTo;
        uint256 amount;
        uint256 timestamp;
        bytes32 txRef;
    }

    mapping(bytes32 => Receipt) public receipts;
    bytes32[] public receiptIds;

    event ReceiptRecorded(bytes32 indexed id, address indexed user, string tokenFrom, string tokenTo, uint256 amount);

    function recordReceipt(
        string calldata tokenFrom,
        string calldata tokenTo,
        uint256 amount,
        bytes32 txRef
    ) external returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(msg.sender, block.timestamp, txRef));
        receipts[id] = Receipt({
            user: msg.sender,
            tokenFrom: tokenFrom,
            tokenTo: tokenTo,
            amount: amount,
            timestamp: block.timestamp,
            txRef: txRef
        });
        receiptIds.push(id);
        emit ReceiptRecorded(id, msg.sender, tokenFrom, tokenTo, amount);
        return id;
    }

    function getReceipt(bytes32 id) external view returns (Receipt memory) {
        return receipts[id];
    }

    function totalReceipts() external view returns (uint256) {
        return receiptIds.length;
    }
}
