/*
 * Copyright 2019-2020, Offchain Labs, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

pragma solidity >=0.5.0;

interface ArbAddressTable {
    // Register an address in the address table
    // Return index of the address (existing index, or newly created index if not already registered)
    function register(address addr) external returns (uint256);

    // Return index of an address in the address table (revert if address isn't in the table)
    function lookup(address addr) external view returns (uint256);

    // Check whether an address exists in the address table
    function addressExists(address addr) external view returns (bool);

    // Get size of address table (= first unused index)
    function size() external view returns (uint256);

    // Return address at a given index in address table (revert if index is beyond end of table)
    function lookupIndex(uint256 index) external view returns (address);

    // Read a compressed address from a bytes buffer
    // Return resulting address and updated offset into the buffer (revert if buffer is too short)
    function decompress(bytes calldata buf, uint256 offset)
        external
        pure
        returns (address, uint256);

    // Compress an address and return the result
    function compress(address addr) external returns (bytes memory);
}
