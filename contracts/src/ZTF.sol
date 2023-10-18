// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "./IFlag.sol";
import "./ICallback.sol";
import "./IRiscZeroVerifier.sol";
import "@openzeppelin/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/token/ERC20/IERC20.sol";
import "@openzeppelin/access/Ownable.sol";

struct Bounty {
    address flag; // will be forwarded to callback. in case of sandbox mode this can be any address
    address owner;
    address callback;
    address asset;
    uint amount;
    bool claimed;
    uint lastUpdated;
    bytes32 envHash;
    string title;
}

struct secondaryCallback {
    address callback;
    uint targetBounty;
    address asset;
    uint amount;
    bool claimed;
}

struct ZClaim {
    address claimer;
    bytes32 txs_hash;
    bytes32 postStateDigest;
    bytes seal;
}

struct Asset {
    address asset;
    uint totalBounty;
    uint claimed;
}

contract ZTF is Ownable {
    using SafeERC20 for IERC20;

    bytes32 public PRE_STATE_DIGEST;
    IRiscZeroVerifier public RISC_ZERO_VERIFIER;

    uint public numBounty = 0;
    uint public numCallback = 0;
    uint public numClaimed = 0;
    uint public numAsset = 0;

    mapping(uint => Bounty) public bountyList;
    mapping(uint => secondaryCallback) public secondaryCallbacks;
    mapping(uint => Asset) public assetList;
    mapping(address => uint) public assetID;

    constructor(
        bytes32 preStateDigest,
        address verifier,
        address[] memory initAsset
    ) Ownable(msg.sender) {
        PRE_STATE_DIGEST = preStateDigest;
        RISC_ZERO_VERIFIER = IRiscZeroVerifier(verifier);
        for (uint i = 0; i < initAsset.length; i++) {
            _addNewAsset(initAsset[i]);
        }
    }

    function getBountyPage(
        uint num,
        uint skip
    ) public view returns (Bounty[] memory) {
        Bounty[] memory result = new Bounty[](num);
        for (uint i = 0; i < num; i++) {
            result[i] = bountyList[i + skip];
        }
        return result;
    }

    function getCallbackPage(
        uint num,
        uint skip
    ) public view returns (secondaryCallback[] memory) {
        secondaryCallback[] memory result = new secondaryCallback[](num);
        for (uint i = 0; i < num; i++) {
            result[i] = secondaryCallbacks[i + skip];
        }
        return result;
    }

    function getAssetStatPage(
        uint num,
        uint skip
    ) public view returns (Asset[] memory) {
        Asset[] memory result = new Asset[](num);
        for (uint i = 0; i < num; i++) {
            result[i] = assetList[i + skip];
        }
        return result;
    }

    function addNewAsset(address asset) external onlyOwner {
        _addNewAsset(asset);
    }

    function _addNewAsset(address asset) internal {
        uint id = numAsset + 1;
        numAsset = id;
        assetList[id] = Asset({asset: asset, totalBounty: 0, claimed: 0});
        assetID[asset] = id;
    }

    // create a new bounty.
    function newBounty(
        address flag,
        address callback,
        address asset,
        uint amount,
        string memory title,
        bytes32 envHash
    ) external {
        uint id = numBounty + 1;
        numBounty = id;
        bountyList[id] = Bounty({
            flag: flag,
            owner: msg.sender,
            callback: callback,
            asset: asset,
            amount: amount,
            claimed: false,
            lastUpdated: block.timestamp,
            title: title,
            envHash: envHash
        });
        numBounty += 1;
        require(
            assetList[assetID[asset]].asset != address(0),
            "Asset not exist"
        );
        assetList[assetID[asset]].totalBounty += amount;
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
    }

    // add bounty to an existing bounty
    function addBounty(uint bountyID, uint amount) external {
        require(
            bountyList[bountyID].owner != address(0),
            "Bounty does not exist"
        );
        bountyList[bountyID].amount += amount;
        assetList[assetID[bountyList[bountyID].asset]].totalBounty += amount;
        IERC20(bountyList[bountyID].asset).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
    }

    // add secondary callback to a bounty. can be claim after the bounty is claimed
    function newSecondaryCallback(
        address callback,
        uint targetBounty,
        address asset,
        uint amount
    ) external {
        uint id = numCallback + 1;
        numCallback = id;
        require(
            bountyList[targetBounty].owner != address(0),
            "Bounty does not exist"
        );
        secondaryCallbacks[id] = secondaryCallback({
            callback: callback,
            targetBounty: targetBounty,
            asset: asset,
            amount: amount,
            claimed: false
        });
        numCallback += 1;

        require(
            assetList[assetID[asset]].asset != address(0),
            "Asset not exist"
        );

        assetList[assetID[asset]].totalBounty += amount;

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
    }

    function addToSecondaryCallback(uint callbackID, uint amount) external {
        require(
            secondaryCallbacks[callbackID].callback != address(0),
            "Secondary callback does not exist"
        );
        secondaryCallbacks[callbackID].amount += amount;
        assetList[assetID[secondaryCallbacks[callbackID].asset]]
            .totalBounty += amount;
        IERC20(secondaryCallbacks[callbackID].asset).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
    }

    // capture flag with a valid proof
    function claim(uint bountyID, ZClaim memory claimData) external {
        // check
        require(
            RISC_ZERO_VERIFIER.verify(
                claimData.seal,
                PRE_STATE_DIGEST,
                claimData.postStateDigest,
                buildJournal(
                    claimData.claimer,
                    claimData.txs_hash,
                    bountyList[bountyID].envHash
                )
            ),
            "Invalid PoV"
        );
        require(
            bountyList[bountyID].claimed == false,
            "Bounty already claimed"
        );

        // update
        bountyList[bountyID].claimed = true;

        // callback
        if (bountyList[bountyID].callback != address(0)) {
            ICallback(bountyList[bountyID].callback).callback(
                bountyList[bountyID].flag
            );
        }

        // pay
        IERC20(bountyList[bountyID].asset).safeTransfer(
            msg.sender,
            bountyList[bountyID].amount
        );

        numClaimed += 1;
        assetList[assetID[bountyList[bountyID].asset]].claimed += bountyList[
            bountyID
        ].amount;
    }

    function buildJournal(
        address claimer,
        bytes32 txHash,
        bytes32 envHash
    ) public pure returns (bytes memory) {
        bytes memory ret = new bytes(336);
        uint idx = 0;
        bytes memory c = abi.encodePacked(claimer, txHash, envHash);
        for (uint i = 0; i < c.length; i++) {
            ret[idx] = c[i];
            idx += 1;
            ret[idx] = 0;
            ret[idx + 1] = 0;
            ret[idx + 2] = 0;
            idx += 3;
        }
        return ret;
    }
}
