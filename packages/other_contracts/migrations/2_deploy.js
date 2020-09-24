const WETH9 = artifacts.require("WETH9")
const MULTICALL = artifacts.require("Multicall")
const ROUTER  = artifacts.require("UniswapV2Router02")
const fs = require('fs')
const contracts = require('../../uniswap-sdk/contract_addresses.json')
module.exports = async function(deployer) {
    await deployer.deploy(MULTICALL);
    const multicallContract = MULTICALL.deployed()
    await deployer.deploy(WETH9);
    const weth9Contract = await  WETH9.deployed()
    await deployer.deploy(ROUTER, contracts.factoryAddress, weth9Contract.address);
    const  routerContract = await ROUTER.deployed()
    fs.writeFileSync('../../packages/uniswap-sdk/contract_addresses.json',JSON.stringify({
      ...contracts,
      wethAddress: weth9Contract.address,
      routerAddress: routerContract.address,
      multicallAddress: multicallContract.address

    }), 'utf-8');
  };
  