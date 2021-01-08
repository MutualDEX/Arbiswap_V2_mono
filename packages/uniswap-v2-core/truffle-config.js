const wrapProvider = require('arb-ethers-web3-bridge').wrapProvider
const HDWalletProvider = require('@truffle/hdwallet-provider')
const mnemonic =
  'surge ability together fruit retire harvest release turkey social coffee owner uphold panel group car'

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*', // Match any network id
    },
    local_arbitrum: {
      provider: function () {
        return wrapProvider(
          new HDWalletProvider(mnemonic, 'http://127.0.0.1:8547/')
        )
      },
      network_id: '*', // Match any network id
      gasPrice: 0,
    },
    remote_arbitrum: {
      provider: function () {
        return wrapProvider(
          new HDWalletProvider(mnemonic, 'https://kovan3.arbitrum.io/rpc')
        )
      },
      network_id: '*', // Match any network id
      gasPrice: 0,
    },
  },
  compilers: {
    solc: {
      version: '0.5.16', // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
}
