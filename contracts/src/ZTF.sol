// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "./IFlag.sol";
import "./ICallback.sol";
import "./IRiscZeroVerifier.sol";
import "./IWormholeRelayer.sol";
import "@openzeppelin/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/token/ERC20/IERC20.sol";
import "@openzeppelin/access/Ownable.sol";

struct Bounty {
    address flag; // will be forwarded to callback. in case of sandbox mode this can be any address
    address owner;
    address callback;
    address asset;
    uint16 chainID; // 0 for this chain. if not 0, require wormhole relayer on the chain.
    bool claimed;
    uint32 gasLimit; // for cross chain callback
    uint256 amount;
    uint256 lastUpdated;
    bytes32 envHash;
    string title;
    string ipfsHash; // ipfs hash of the bounty
}

struct SecondaryCallback {
    address callback;
    uint256 targetBounty;
    uint256 amount;
    address asset;
    bool claimed;
    uint16 chainID; // 0 for this chain. if not 0, require wormhole relayer on the chain.
    uint32 gasLimit; // for cross chain callback
}

struct ZClaim {
    address claimer;
    bytes32 txs_hash;
    bytes32 postStateDigest;
    bytes seal;
}

struct Asset {
    address asset;
    uint total;
    uint claimed;
}

contract ZTF is Ownable {
    using SafeERC20 for IERC20;

    bytes32 public PRE_STATE_DIGEST;
    IRiscZeroVerifier public immutable RISC_ZERO_VERIFIER;
    IWormholeRelayer public immutable WORMHOLE_RELAYER;

    uint public numBounty = 0;
    uint public numCallback = 0;
    uint public numClaimed = 0;
    uint public numAsset = 0;

    mapping(uint => Bounty) public bountyList;
    mapping(uint => SecondaryCallback) public secondaryCallbacks;
    mapping(uint => Asset) public assetList;
    mapping(address => uint) public assetID;

    event NewBounty(uint indexed bountyID, address indexed owner);
    event BountyClaimed(uint indexed bountyID, address indexed claimer);

    constructor(
        bytes32 preStateDigest,
        address verifier,
        address wormholeRelayer,
        address[] memory initAsset
    ) Ownable(msg.sender) {
        PRE_STATE_DIGEST = preStateDigest;
        RISC_ZERO_VERIFIER = IRiscZeroVerifier(verifier);
        WORMHOLE_RELAYER = IWormholeRelayer(wormholeRelayer); // 0 if not exist on the chain
        for (uint i = 0; i < initAsset.length; i++) {
            _addNewAsset(initAsset[i]);
        }
    }

    function setPreStateDigest(bytes32 preStateDigest) external onlyOwner {
        PRE_STATE_DIGEST = preStateDigest;
    }

    function getBountyPage(
        uint num,
        uint skip
    ) public view returns (Bounty[] memory) {
        num = num > numBounty - skip ? numBounty - skip : num;
        Bounty[] memory result = new Bounty[](num);
        for (uint i = 0; i < num; i++) {
            result[i] = bountyList[i + skip];
        }
        return result;
    }

    function getCallbackPage(
        uint num,
        uint skip
    ) public view returns (SecondaryCallback[] memory) {
        num = num > numCallback - skip ? numCallback - skip : num;
        SecondaryCallback[] memory result = new SecondaryCallback[](num);
        for (uint i = 0; i < num; i++) {
            result[i] = secondaryCallbacks[i + skip];
        }
        return result;
    }

    function getAssetStatPage(
        uint num,
        uint skip
    ) public view returns (Asset[] memory) {
        num = num > numAsset - skip ? numAsset - skip : num;
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
        uint id = numAsset;
        numAsset = id + 1;
        assetList[id] = Asset({asset: asset, total: 0, claimed: 0});
        assetID[asset] = id;
    }

    // create a new bounty.
    function newBounty(
        address flag,
        address callback,
        address asset,
        uint amount,
        string memory title,
        string memory ipfsHash,
        bytes32 envHash,
        uint16 chainID,
        uint32 gasLimit
    ) external {
        if (address(WORMHOLE_RELAYER) == address(0)) {
            require(chainID == 0, "Invalid chainID");
        }
        uint id = numBounty;
        numBounty = id + 1;
        bountyList[id] = Bounty({
            flag: flag,
            owner: msg.sender,
            callback: callback,
            asset: asset,
            amount: amount,
            chainID: chainID,
            claimed: false,
            lastUpdated: block.timestamp,
            title: title,
            ipfsHash: ipfsHash,
            gasLimit: gasLimit,
            envHash: envHash
        });
        require(
            assetList[assetID[asset]].asset != address(0),
            "Asset not exist"
        );
        assetList[assetID[asset]].total += amount;
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        emit NewBounty(id, msg.sender);
    }

    // add bounty to an existing bounty
    function addBounty(uint bountyID, uint amount) external {
        require(
            bountyList[bountyID].owner != address(0),
            "Bounty does not exist"
        );
        require(amount > 0, "Amount must be greater than 0");
        require(
            bountyList[bountyID].claimed == false,
            "Bounty already claimed"
        );
        bountyList[bountyID].amount += amount;
        bountyList[bountyID].lastUpdated = block.timestamp;
        assetList[assetID[bountyList[bountyID].asset]].total += amount;
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
        uint amount,
        uint16 chainID,
        uint32 gasLimit
    ) external {
        uint id = numCallback;
        numCallback = id + 1;
        if (address(WORMHOLE_RELAYER) == address(0)) {
            require(chainID == 0, "Invalid chainID");
        }
        require(
            bountyList[targetBounty].owner != address(0),
            "Bounty does not exist"
        );
        secondaryCallbacks[id] = SecondaryCallback({
            callback: callback,
            targetBounty: targetBounty,
            asset: asset,
            amount: amount,
            chainID: chainID,
            gasLimit: gasLimit,
            claimed: false
        });
        numCallback += 1;

        require(
            assetList[assetID[asset]].asset != address(0),
            "Asset not exist"
        );

        assetList[assetID[asset]].total += amount;

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
    }

    function addToSecondaryCallback(uint callbackID, uint amount) external {
        require(
            secondaryCallbacks[callbackID].callback != address(0),
            "Secondary callback does not exist"
        );
        secondaryCallbacks[callbackID].amount += amount;
        assetList[assetID[secondaryCallbacks[callbackID].asset]]
            .total += amount;
        IERC20(secondaryCallbacks[callbackID].asset).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
    }

    // capture flag with a valid proof
    function claim(uint bountyID, ZClaim memory claimData) external payable {
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
        require(!bountyList[bountyID].claimed, "Bounty already claimed");

        // update
        bountyList[bountyID].claimed = true;

        // callback
        if (bountyList[bountyID].callback != address(0)) {
            if (bountyList[bountyID].chainID == 0) {
                ICallback(bountyList[bountyID].callback).callback(
                    bountyList[bountyID].flag,
                    claimData.claimer
                );
            } else {
                (uint fee, ) = WORMHOLE_RELAYER.quoteEVMDeliveryPrice(
                    bountyList[bountyID].chainID,
                    0,
                    bountyList[bountyID].gasLimit
                );
                require(msg.value > fee, "Insufficient fee");
                WORMHOLE_RELAYER.sendPayloadToEvm{value: fee}(
                    bountyList[bountyID].chainID,
                    bountyList[bountyID].callback,
                    abi.encode(bountyList[bountyID].flag, claimData.claimer),
                    0,
                    bountyList[bountyID].gasLimit
                );
            }
        }

        // pay
        IERC20(bountyList[bountyID].asset).safeTransfer(
            claimData.claimer,
            bountyList[bountyID].amount
        );

        numClaimed += 1;
        assetList[assetID[bountyList[bountyID].asset]].claimed += bountyList[
            bountyID
        ].amount;

        emit BountyClaimed(bountyID, claimData.claimer);
    }

    function triggerCallback(uint[] memory targets) external payable {
        uint eth = msg.value;
        for (uint i = 0; i < targets.length; i++) {
            require(
                secondaryCallbacks[targets[i]].callback != address(0),
                "Secondary callback does not exist"
            );
            require(
                bountyList[secondaryCallbacks[targets[i]].targetBounty]
                    .claimed == true,
                "Target bounty not claimed"
            );
            require(
                secondaryCallbacks[targets[i]].claimed == false,
                "Secondary callback already claimed"
            );
            secondaryCallbacks[targets[i]].claimed = true;

            if (secondaryCallbacks[targets[i]].chainID == 0) {
                ICallback(secondaryCallbacks[targets[i]].callback).callback(
                    bountyList[secondaryCallbacks[targets[i]].targetBounty]
                        .flag,
                    msg.sender
                );
            } else {
                (uint fee, ) = WORMHOLE_RELAYER.quoteEVMDeliveryPrice(
                    secondaryCallbacks[targets[i]].chainID,
                    0,
                    secondaryCallbacks[targets[i]].gasLimit
                );
                require(eth > fee, "insufficient fund");
                eth = eth - fee;
                WORMHOLE_RELAYER.sendPayloadToEvm{value: fee}(
                    secondaryCallbacks[targets[i]].chainID,
                    secondaryCallbacks[targets[i]].callback,
                    abi.encode(
                        bountyList[secondaryCallbacks[targets[i]].targetBounty]
                            .flag,
                        msg.sender
                    ),
                    0,
                    secondaryCallbacks[targets[i]].gasLimit
                );
            }

            IERC20(secondaryCallbacks[targets[i]].asset).safeTransfer(
                msg.sender,
                secondaryCallbacks[targets[i]].amount
            );
            assetList[assetID[secondaryCallbacks[targets[i]].asset]]
                .claimed += secondaryCallbacks[targets[i]].amount;
        }
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
