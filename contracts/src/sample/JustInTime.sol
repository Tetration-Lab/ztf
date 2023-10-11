// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "../IFlag.sol";

// For more documentation, please see https://en.wikipedia.org/wiki/Just-in-time_compilation
//
// We apologize for any bugs in our compiler software.
contract JIT is IFlag {
    struct BasicBlock {
        uint start;
        uint end;
        uint dst1;
        uint dst2;
    }

    uint constant INVALID_ADDR = 0xffffffffffffffffffffffffffffffffffffff;

    // Relocation info
    struct CodeLabel {
        uint bytecodeOffset;
        uint dstBlock;
    }

    mapping(uint => uint) private loops;
    uint[] private stack; // loop stack

    // Control flow graph
    BasicBlock[] private blocks;

    // Codegen
    CodeLabel[] private labels;
    mapping(uint => uint) private basicBlockAddrs;

    uint8[] code;

    // I can receive money. But how to get it out?
    receive() external payable {}

    function capture() external override {
        if (address(this).balance == 0) {
            emit Captured();
        }
    }

    function invoke(bytes calldata _program, bytes calldata stdin) public {
        bytes memory program = bytes(_program);

        code = [
            OP_PUSH4,
            0,
            0,
            0,
            0, // length
            OP_DUP1,
            OP_PUSH1,
            14, // offset
            OP_PUSH1,
            0, // destoffset
            OP_CODECOPY,
            OP_PUSH1,
            0,
            OP_RETURN
        ];

        uint constructorCodeSize = code.length;

        // Control flow analysis
        {
            // Pass 1: Jump target analysis
            for (uint i = 0; i < program.length; i++) {
                bytes1 op = program[i];
                if (op == "[") {
                    stack.push(i);
                } else if (op == "]") {
                    uint j = stack[stack.length - 1];
                    stack.pop();
                    loops[i] = j;
                    loops[j] = i;
                }
            }
            delete stack;

            // Pass 2: Build control flow graph
            BasicBlock memory curBlock = BasicBlock({
                start: 0,
                end: INVALID_ADDR,
                dst1: INVALID_ADDR,
                dst2: INVALID_ADDR
            });
            for (uint i = 0; i < program.length; i++) {
                bytes1 op = program[i];
                if (op == "[") {
                    if (curBlock.start != i) {
                        // curBlock is non-empty
                        curBlock.end = i;
                        curBlock.dst1 = i; // loop entry edge
                        blocks.push(curBlock);
                    } // otherwise, if empty, just discard the empty curBlock
                    blocks.push(
                        BasicBlock({
                            start: i,
                            end: i + 1,
                            dst1: i + 1,
                            dst2: loops[i] + 1
                        })
                    ); // loop header block
                    curBlock = BasicBlock({
                        start: i + 1,
                        end: INVALID_ADDR,
                        dst1: INVALID_ADDR,
                        dst2: INVALID_ADDR
                    });
                } else if (op == "]") {
                    curBlock.end = i + 1;
                    curBlock.dst1 = loops[i]; // back edge
                    blocks.push(curBlock);
                    curBlock = BasicBlock({
                        start: i + 1,
                        end: INVALID_ADDR,
                        dst1: INVALID_ADDR,
                        dst2: INVALID_ADDR
                    });
                }
            }
            if (curBlock.start != program.length) {
                curBlock.end = program.length;
                blocks.push(curBlock);
            }
        }

        // Peephole optimization pass
        {
            // Contraction (++++ -> A4##, >>>> -> R4##)
            for (uint i = 0; i < blocks.length; i++) {
                BasicBlock memory bb = blocks[i];
                bytes1 prevOp = "#";
                uint repeat = 0;
                for (uint j = bb.start; j < bb.end; j++) {
                    bytes1 op = program[j];
                    if (op == "#") continue;
                    if (op == prevOp) {
                        repeat++;
                    } else {
                        if (repeat > 2) {
                            bytes1 newOp = 0;
                            if (prevOp == ">") {
                                newOp = "R";
                            } else if (prevOp == "<") {
                                newOp = "L";
                            } else if (prevOp == "+") {
                                newOp = "A";
                            } else if (prevOp == "-") {
                                newOp = "S";
                            }
                            if (newOp != 0) {
                                program[j - repeat] = newOp;
                                program[j - repeat + 1] = bytes1(
                                    uint8(repeat >> 8)
                                );
                                program[j - repeat + 2] = bytes1(uint8(repeat));
                                for (uint k = 0; k < repeat - 3; k++) {
                                    program[j - repeat + 3 + k] = "#"; // no-op
                                }
                            }
                        }
                        prevOp = op;
                        repeat = 1;
                    }
                }
            }

            // Clear loops [-] -> 0##
            for (uint i = 0; i < blocks.length; i++) {
                BasicBlock memory bb = blocks[i];
                if (bb.end == bb.start + 2 && bb.dst1 + 1 == bb.start) {
                    if (
                        program[bb.start] == "-" && program[bb.start + 1] == "]"
                    ) {
                        if (program[bb.dst1] != "[") revert("invalid code");
                        program[bb.dst1] = "0";
                        program[bb.start] = "#";
                        program[bb.start + 1] = "#";
                    }
                }
            }
        }

        // Code generation
        //
        // Stack layout
        //
        // <scratch space>
        // <ptr>
        // <io_ptr>
        //
        // Memory layout
        //
        // VM memory begins at 0x8000
        {
            // Pass 1. Lowering

            code.push(OP_PUSH1);
            code.push(0); // io_ptr := 0
            code.push(OP_PUSH2);
            code.push(0x80);
            code.push(0x00); // ptr := 0x8000

            for (uint i = 0; i < blocks.length; i++) {
                BasicBlock memory bb = blocks[i];

                basicBlockAddrs[bb.start] = code.length - constructorCodeSize;
                code.push(OP_JUMPDEST);

                for (uint j = bb.start; j < bb.end; j++) {
                    bytes1 op = program[j];

                    // Standard ops
                    if (op == ">") {
                        code.push(OP_PUSH1);
                        code.push(32);
                        code.push(OP_ADD);
                    } else if (op == "<") {
                        code.push(OP_PUSH1);
                        code.push(32);
                        code.push(OP_SWAP1);
                        code.push(OP_SUB);
                    } else if (op == "+") {
                        code.push(OP_DUP1);
                        code.push(OP_MLOAD);
                        code.push(OP_PUSH1);
                        code.push(1);
                        code.push(OP_ADD);
                        code.push(OP_DUP2);
                        code.push(OP_MSTORE);
                    } else if (op == "-") {
                        code.push(OP_DUP1);
                        code.push(OP_MLOAD);
                        code.push(OP_PUSH1);
                        code.push(1);
                        code.push(OP_SWAP1);
                        code.push(OP_SUB);
                        code.push(OP_DUP2);
                        code.push(OP_MSTORE);
                    } else if (op == ".") {
                        code.push(OP_PUSH1);
                        code.push(1);
                        code.push(OP_DUP2);
                        code.push(OP_PUSH1);
                        code.push(31);
                        code.push(OP_ADD);
                        code.push(OP_LOG0);
                    } else if (op == ",") {
                        code.push(OP_DUP2);
                        code.push(OP_CALLDATALOAD);
                        code.push(OP_PUSH1);
                        code.push(248);
                        code.push(OP_SHR);
                        code.push(OP_DUP2);
                        code.push(OP_MSTORE);

                        code.push(OP_SWAP1);
                        code.push(OP_PUSH1);
                        code.push(1);
                        code.push(OP_ADD);
                        code.push(OP_SWAP1);
                    } else if (op == "[") {
                        code.push(OP_DUP1);
                        code.push(OP_MLOAD);

                        labels.push(
                            CodeLabel({
                                bytecodeOffset: code.length + 1,
                                dstBlock: bb.dst1
                            })
                        );
                        code.push(OP_PUSH4);
                        code.push(0);
                        code.push(0);
                        code.push(0);
                        code.push(0);
                        code.push(OP_JUMPI);

                        labels.push(
                            CodeLabel({
                                bytecodeOffset: code.length + 1,
                                dstBlock: bb.dst2
                            })
                        );
                        code.push(OP_PUSH4);
                        code.push(0);
                        code.push(0);
                        code.push(0);
                        code.push(0);
                        code.push(OP_JUMP);
                    } else if (op == "]") {
                        labels.push(
                            CodeLabel({
                                bytecodeOffset: code.length + 1,
                                dstBlock: bb.dst1
                            })
                        );
                        code.push(OP_PUSH4);
                        code.push(0);
                        code.push(0);
                        code.push(0);
                        code.push(0);
                        code.push(OP_JUMP);

                        // Pseudo-ops
                    } else if (op == "R") {
                        uint n = 32 *
                            ((uint16(uint8(program[j + 1])) << 8) |
                                (uint16(uint8(program[j + 2]))));
                        code.push(OP_PUSH2);
                        code.push(uint8(n >> 8));
                        code.push(uint8(n));
                        code.push(OP_ADD);
                        j += 2;
                    } else if (op == "L") {
                        uint n = 32 *
                            ((uint16(uint8(program[j + 1])) << 8) |
                                (uint16(uint8(program[j + 2]))));
                        code.push(OP_PUSH2);
                        code.push(uint8(n >> 8));
                        code.push(uint8(n));
                        code.push(OP_SWAP1);
                        code.push(OP_SUB);
                        j += 2;
                    } else if (op == "A") {
                        code.push(OP_DUP1);
                        code.push(OP_MLOAD);
                        code.push(OP_PUSH2);
                        code.push(uint8(program[j + 1]));
                        code.push(uint8(program[j + 2]));
                        code.push(OP_ADD);
                        code.push(OP_DUP2);
                        code.push(OP_MSTORE);
                        j += 2;
                    } else if (op == "S") {
                        code.push(OP_DUP1);
                        code.push(OP_MLOAD);
                        code.push(OP_PUSH2);
                        code.push(uint8(program[j + 1]));
                        code.push(uint8(program[j + 2]));
                        code.push(OP_SWAP1);
                        code.push(OP_SUB);
                        code.push(OP_DUP2);
                        code.push(OP_MSTORE);
                        j += 2;
                    } else if (op == "0") {
                        code.push(OP_PUSH1);
                        code.push(0);
                        code.push(OP_DUP2);
                        code.push(OP_MSTORE);
                    } else if (op == "#") {
                        // no-op
                        code.push(OP_JUMPDEST);
                    } else {
                        // invalid op
                        code.push(0xde);
                        code.push(0xad);
                        code.push(uint8(op));
                        code.push(0xbe);
                        code.push(0xef);
                    }
                }
            }
            basicBlockAddrs[program.length] = code.length - constructorCodeSize;
            code.push(OP_JUMPDEST);
            code.push(OP_STOP);
            delete blocks;

            // Pass 2. Linking and assembling of labels

            for (uint i = 0; i < labels.length; i++) {
                uint p = labels[i].bytecodeOffset;
                uint dst = basicBlockAddrs[labels[i].dstBlock];
                if (dst == 0) revert("invalid code");
                code[p + 0] = uint8(dst >> 24);
                code[p + 1] = uint8(dst >> 16);
                code[p + 2] = uint8(dst >> 8);
                code[p + 3] = uint8(dst >> 0);
            }
            delete labels;
        }

        // Emit and call code
        {
            uint len = code.length - constructorCodeSize;
            code[1] = uint8(len >> 24);
            code[2] = uint8(len >> 16);
            code[3] = uint8(len >> 8);
            code[4] = uint8(len >> 0);

            bytes memory codeM = new bytes(code.length);
            for (uint i = 0; i < code.length; i++) {
                codeM[i] = bytes1(code[i]);
            }
            delete code;

            address c;
            assembly {
                c := create(0, add(codeM, 32), mload(codeM))
            }
            (bool success, ) = c.delegatecall(stdin);
            if (!success) {
                revert("call failed");
            }
        }
    }
}

uint8 constant OP_STOP = 0x00;
uint8 constant OP_ADD = 0x01;
uint8 constant OP_MUL = 0x02;
uint8 constant OP_SUB = 0x03;
uint8 constant OP_DIV = 0x04;
uint8 constant OP_SDIV = 0x05;
uint8 constant OP_MOD = 0x06;
uint8 constant OP_SMOD = 0x07;
uint8 constant OP_ADDMOD = 0x08;
uint8 constant OP_MULMOD = 0x09;
uint8 constant OP_EXP = 0x0a;
uint8 constant OP_SIGNEXTEND = 0x0b;
uint8 constant OP_LT = 0x10;
uint8 constant OP_GT = 0x11;
uint8 constant OP_SLT = 0x12;
uint8 constant OP_SGT = 0x13;
uint8 constant OP_EQ = 0x14;
uint8 constant OP_ISZERO = 0x15;
uint8 constant OP_AND = 0x16;
uint8 constant OP_OR = 0x17;
uint8 constant OP_XOR = 0x18;
uint8 constant OP_NOT = 0x19;
uint8 constant OP_BYTE = 0x1a;
uint8 constant OP_SHL = 0x1b;
uint8 constant OP_SHR = 0x1c;
uint8 constant OP_SAR = 0x1d;
uint8 constant OP_KECCAK256 = 0x20;
uint8 constant OP_ADDRESS = 0x30;
uint8 constant OP_BALANCE = 0x31;
uint8 constant OP_ORIGIN = 0x32;
uint8 constant OP_CALLER = 0x33;
uint8 constant OP_CALLVALUE = 0x34;
uint8 constant OP_CALLDATALOAD = 0x35;
uint8 constant OP_CALLDATASIZE = 0x36;
uint8 constant OP_CALLDATACOPY = 0x37;
uint8 constant OP_CODESIZE = 0x38;
uint8 constant OP_CODECOPY = 0x39;
uint8 constant OP_GASPRICE = 0x3a;
uint8 constant OP_EXTCODESIZE = 0x3b;
uint8 constant OP_EXTCODECOPY = 0x3c;
uint8 constant OP_RETURNDATASIZE = 0x3d;
uint8 constant OP_RETURNDATACOPY = 0x3e;
uint8 constant OP_EXTCODEHASH = 0x3f;
uint8 constant OP_BLOCKHASH = 0x40;
uint8 constant OP_COINBASE = 0x41;
uint8 constant OP_TIMESTAMP = 0x42;
uint8 constant OP_NUMBER = 0x43;
uint8 constant OP_DIFFICULTY = 0x44;
uint8 constant OP_GASLIMIT = 0x45;
uint8 constant OP_CHAINID = 0x46;
uint8 constant OP_BASEFEE = 0x48;
uint8 constant OP_POP = 0x50;
uint8 constant OP_MLOAD = 0x51;
uint8 constant OP_MSTORE = 0x52;
uint8 constant OP_MSTORE8 = 0x53;
uint8 constant OP_SLOAD = 0x54;
uint8 constant OP_SSTORE = 0x55;
uint8 constant OP_JUMP = 0x56;
uint8 constant OP_JUMPI = 0x57;
uint8 constant OP_GETPC = 0x58;
uint8 constant OP_MSIZE = 0x59;
uint8 constant OP_GAS = 0x5a;
uint8 constant OP_JUMPDEST = 0x5b;
uint8 constant OP_PUSH1 = 0x60;
uint8 constant OP_PUSH2 = 0x61;
uint8 constant OP_PUSH3 = 0x62;
uint8 constant OP_PUSH4 = 0x63;
uint8 constant OP_PUSH5 = 0x64;
uint8 constant OP_PUSH6 = 0x65;
uint8 constant OP_PUSH7 = 0x66;
uint8 constant OP_PUSH8 = 0x67;
uint8 constant OP_PUSH9 = 0x68;
uint8 constant OP_PUSH10 = 0x69;
uint8 constant OP_PUSH11 = 0x6a;
uint8 constant OP_PUSH12 = 0x6b;
uint8 constant OP_PUSH13 = 0x6c;
uint8 constant OP_PUSH14 = 0x6d;
uint8 constant OP_PUSH15 = 0x6e;
uint8 constant OP_PUSH16 = 0x6f;
uint8 constant OP_PUSH17 = 0x70;
uint8 constant OP_PUSH18 = 0x71;
uint8 constant OP_PUSH19 = 0x72;
uint8 constant OP_PUSH20 = 0x73;
uint8 constant OP_PUSH21 = 0x74;
uint8 constant OP_PUSH22 = 0x75;
uint8 constant OP_PUSH23 = 0x76;
uint8 constant OP_PUSH24 = 0x77;
uint8 constant OP_PUSH25 = 0x78;
uint8 constant OP_PUSH26 = 0x79;
uint8 constant OP_PUSH27 = 0x7a;
uint8 constant OP_PUSH28 = 0x7b;
uint8 constant OP_PUSH29 = 0x7c;
uint8 constant OP_PUSH30 = 0x7d;
uint8 constant OP_PUSH31 = 0x7e;
uint8 constant OP_PUSH32 = 0x7f;
uint8 constant OP_DUP1 = 0x80;
uint8 constant OP_DUP2 = 0x81;
uint8 constant OP_DUP3 = 0x82;
uint8 constant OP_DUP4 = 0x83;
uint8 constant OP_DUP5 = 0x84;
uint8 constant OP_DUP6 = 0x85;
uint8 constant OP_DUP7 = 0x86;
uint8 constant OP_DUP8 = 0x87;
uint8 constant OP_DUP9 = 0x88;
uint8 constant OP_DUP10 = 0x89;
uint8 constant OP_DUP11 = 0x8a;
uint8 constant OP_DUP12 = 0x8b;
uint8 constant OP_DUP13 = 0x8c;
uint8 constant OP_DUP14 = 0x8d;
uint8 constant OP_DUP15 = 0x8e;
uint8 constant OP_DUP16 = 0x8f;
uint8 constant OP_SWAP1 = 0x90;
uint8 constant OP_SWAP2 = 0x91;
uint8 constant OP_SWAP3 = 0x92;
uint8 constant OP_SWAP4 = 0x93;
uint8 constant OP_SWAP5 = 0x94;
uint8 constant OP_SWAP6 = 0x95;
uint8 constant OP_SWAP7 = 0x96;
uint8 constant OP_SWAP8 = 0x97;
uint8 constant OP_SWAP9 = 0x98;
uint8 constant OP_SWAP10 = 0x99;
uint8 constant OP_SWAP11 = 0x9a;
uint8 constant OP_SWAP12 = 0x9b;
uint8 constant OP_SWAP13 = 0x9c;
uint8 constant OP_SWAP14 = 0x9d;
uint8 constant OP_SWAP15 = 0x9e;
uint8 constant OP_SWAP16 = 0x9f;
uint8 constant OP_LOG0 = 0xa0;
uint8 constant OP_LOG1 = 0xa1;
uint8 constant OP_LOG2 = 0xa2;
uint8 constant OP_LOG3 = 0xa3;
uint8 constant OP_LOG4 = 0xa4;
uint8 constant OP_JUMPTO = 0xb0;
uint8 constant OP_JUMPIF = 0xb1;
uint8 constant OP_JUMPSUB = 0xb2;
uint8 constant OP_JUMPSUBV = 0xb4;
uint8 constant OP_BEGINSUB = 0xb5;
uint8 constant OP_BEGINDATA = 0xb6;
uint8 constant OP_RETURNSUB = 0xb8;
uint8 constant OP_PUTLOCAL = 0xb9;
uint8 constant OP_GETLOCAL = 0xba;
uint8 constant OP_SLOADBYTES = 0xe1;
uint8 constant OP_SSTOREBYTES = 0xe2;
uint8 constant OP_SSIZE = 0xe3;
uint8 constant OP_CREATE = 0xf0;
uint8 constant OP_CALL = 0xf1;
uint8 constant OP_CALLCODE = 0xf2;
uint8 constant OP_RETURN = 0xf3;
uint8 constant OP_DELEGATECALL = 0xf4;
uint8 constant OP_CREATE2 = 0xf5;
uint8 constant OP_STATICCALL = 0xfa;
uint8 constant OP_TXEXECGAS = 0xfc;
uint8 constant OP_REVERT = 0xfd;
uint8 constant OP_SELFDESTRUCT = 0xff;
