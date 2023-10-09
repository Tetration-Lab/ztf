// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "./IFlag.sol";
import "./ICallback.sol";
import "./IRiscZeroVerifier.sol";

contract ZTF {
    struct Bounty {
        uint bounty;
        address flag;
        address owner;
        address callback;
        bool claimed;
    }
    struct secondaryCallback {
        address callback;
        uint targetBounty;
        uint bonus;
        bool claimed;
    }
    struct ZClaim {
        address claimer;
        address flag;
        bytes32 txs_hash;
        bytes32 postStateDigest;
        bytes journal;
        bytes seal;
    }

    mapping(uint => Bounty) public bountyList;
    mapping(uint => secondaryCallback) public secondaryCallbacks;
    bytes32 public immutable IMG_ID;
    address public constant riskZeroVerifier = 0x000000000000000000000000000000000000dEaD;

    constructor(bytes32 imgID) {
        IMG_ID = imgID;
    }

    // create a new bounty.
    function newBounty(address flag, address callback) external payable {
        uint id = uint(keccak256(abi.encodePacked(msg.sender, flag)));
        require(bountyList[id].owner == address(0), "Bounty already exists");
        bountyList[id] = Bounty({
            bounty: msg.value,
            flag: flag,
            owner: msg.sender,
            callback: callback,
            claimed: false
        });
    }

    // add bounty to an existing bounty
    function addBounty(uint bountyID) external payable {
        require(
            bountyList[bountyID].owner != address(0),
            "Bounty does not exist"
        );
        bountyList[bountyID].bounty += msg.value;
    }
    
    // add secondary callback to a bounty. can be claim after the bounty is claimed
    function addSecondaryCallback(
        address callback,
        uint targetBounty
    ) external payable {
        uint id = uint(keccak256(abi.encodePacked(msg.sender, callback)));
        require(
            secondaryCallbacks[id].callback == address(0),
            "Secondary callback already exists"
        );
        secondaryCallbacks[id] = secondaryCallback({
            callback: callback,
            targetBounty: targetBounty,
            bonus: msg.value,
            claimed: false
        });
    }
    // capture flag with a valid proof
    function claim(
        uint bountyID,
        ZClaim memory claimData
    ) external {
        IRiscZeroVerifier verifier = IRiscZeroVerifier(riskZeroVerifier);
        // check
        require(
            verifier.verify(
                claimData.seal,
                IMG_ID,
                claimData.postStateDigest,
                claimData.journal
            ),
            "Invalid seal"
        );
        require(
            bountyList[bountyID].claimed == false,
            "Bounty already claimed"
        );
        require(
            bountyList[bountyID].flag == claimData.flag,
            "Flag does not match"
        );

        // update
        bountyList[bountyID].claimed = true;

        // pay
        uint totalBounty = bountyList[bountyID].bounty;
        payable(claimData.claimer).transfer(totalBounty);

        // callback
        ICallback(bountyList[bountyID].callback).callback(bountyList[bountyID].flag);
    }

    // trigger list of secondary callbacks if bounty is claimed
    function triggerCallback(uint[] memory targets) external{
        for(uint i = 0; i < targets.length; i++){
            require(
                secondaryCallbacks[targets[i]].callback != address(0),
                "Secondary callback does not exist"
            );
            require(
                bountyList[secondaryCallbacks[targets[i]].targetBounty].claimed == true,
                "Target bounty not claimed"
            );
            require(
                secondaryCallbacks[targets[i]].claimed == false,
                "Secondary callback already claimed"
            );
            secondaryCallbacks[targets[i]].claimed = true;
            ICallback(secondaryCallbacks[targets[i]].callback).callback(bountyList[secondaryCallbacks[targets[i]].targetBounty].flag);
            payable(msg.sender).transfer(secondaryCallbacks[targets[i]].bonus);
        }
    } 
}
