import { benchmarks, swapTokensForExactTokensBytes, swapExactTokensForTokensBytes, addLiquidityEthBytesRevert, addLiquidityEthBytes, signer, setup, getReserves, quotePrice, swapETHForExactTokensBytes, swapExactETHForTokensBytes, etherVal, swapTokensForExactEthBytes, removeLiquidityEth } from './app'

import {  contractAddresses } from "@uniswap/sdk";
import { utils } from "ethers";


const between = (min: utils.BigNumber, target: utils.BigNumber, max: utils.BigNumber)=>{
  return min.lt(target) && target.lte(max)
}

const assert = require('assert');

describe('addLiquidityEth tests', function() {
    const count = 3
    it(`handles ${count} addLiquiditiyETH calls`, async function() {
        const [oldtestTokenReserves,  oldEthReserves] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.wethAddress)
        const oldTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)

        const oldBal = await signer.getBalance()

        return benchmarks.run([{
          method: addLiquidityEthBytes,
          count,
          name: "addLiquidityEth test",
          getNonce: () => signer.getTransactionCount()
        }]).then(async (benchmarkReport)=>{
          const [newtestTokenReserves, newEthReserves  ] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.wethAddress)
          const newTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)
          const newBal = await signer.getBalance()

          const minEthVal = etherVal.mul(995).div(1000)


          assert.ok(benchmarkReport.succeeded)
          // TODO why?
          assert.ok(
            between (oldEthReserves.add(minEthVal.mul(count)), newEthReserves, oldEthReserves.add(etherVal.mul(count)))
          , "old eth reserves... close enough?")
          assert.ok(oldtestTokenReserves.add(oldTestTokenPrice.mul(count)).eq(newtestTokenReserves) , "TestToken reserves increase as expected")
          assert.ok(oldTestTokenPrice.eq(newTestTokenPrice), "WETH/Token price doesn't change")
        })
    });


    it('reverts on invalid addLiquiditiyETH call ', async function() {
      const [oldtestTokenReserves,  oldEthReserves] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.wethAddress)
      const count = 1

      return benchmarks.run([{
        method: addLiquidityEthBytesRevert,
        count,
        name: "addLiquidityEth test",
        getNonce: () => signer.getTransactionCount()
      }]).then(async (benchmarkReport)=>{

        assert.ok(!benchmarkReport.succeeded)
        const [newtestTokenReserves, newEthReserves  ] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.wethAddress)

        assert.ok(oldtestTokenReserves.eq(newtestTokenReserves), "TestToken reserves didn't change")
        assert.ok(oldEthReserves.eq(newEthReserves), "WETH reserves did't change")

      })
    });

  })

  describe('Remove liquidity ETH', function() {
    const count = 1
      it(`handles ${count} removeLiqudityEth calls`, async function() {
        return benchmarks.run([{
          method: removeLiquidityEth,
          count,
          name: "removeLiqudityEth test",
          getNonce: () => signer.getTransactionCount()
        }]).then(async (benchmarkReport)=>{
          assert.ok(benchmarkReport.succeeded)

        })
    })
  })

  describe('swapETHForExactTokens tests', function() {
    const count = 1
      it(`handles ${count} swapExactETHForTokens calls`, async function() {
        const [oldtestTokenReserves,  oldEthReserves] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.wethAddress)
        const oldTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)

        return benchmarks.run([{
          method: swapETHForExactTokensBytes,
          count,
          name: "swapETHForExactTokens test",
          getNonce: () => signer.getTransactionCount()
        }]).then(async (benchmarkReport)=>{
          const [newtestTokenReserves, newEthReserves  ] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.wethAddress)
          const newTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)
          assert.ok(benchmarkReport.succeeded)

          assert.ok(oldEthReserves.lt(newEthReserves) , "WETH reserves increase")
          assert.ok(oldtestTokenReserves.sub(etherVal.mul(count)).eq(newtestTokenReserves) , "Test Token Reserves decrease as expected")
          assert.ok(oldTestTokenPrice.gt(newTestTokenPrice), "Token quoted amount goes down after swaps")
        })
    })
  })


  describe('swapExactETHForTokens tests', function() {
    it('handles 3 swapExactETHForTokens calls', async function() {
      const [oldtestTokenReserves,  oldEthReserves] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.wethAddress)
      const oldTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)
      const count = 1
      return benchmarks.run([{
        method: swapExactETHForTokensBytes,
        count,
        name: "swapExactETHForTokens test",
        getNonce: () => signer.getTransactionCount()
      }]).then(async (benchmarkReport)=>{
        const [newtestTokenReserves, newEthReserves  ] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.wethAddress)
        const newTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)
        assert.ok(benchmarkReport.succeeded)

        assert.ok(oldtestTokenReserves.gt(newtestTokenReserves) , "Tokens reserves decrease")
        assert.ok(oldEthReserves.add(etherVal.mul(count)).eq(newEthReserves) , "ETH Reserves increase as expected")
        assert.ok(oldTestTokenPrice.gt(newTestTokenPrice), "Token quoted amount goes down after swaps")
      })
  })
})


describe('swapTokensForExactEth tests', function() {
  it('handles swapTokensForExactEth calls', async function() {
    const [oldtestTokenReserves,  oldEthReserves] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.wethAddress)
    const oldTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)
    const count = 1
    return benchmarks.run([{
      method: swapTokensForExactEthBytes,
      count,
      name: "swapTokensForExactEth test",
      getNonce: () => signer.getTransactionCount()
    }]).then(async (benchmarkReport)=>{
      const [newtestTokenReserves, newEthReserves  ] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.wethAddress)
      const newTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)
      assert.ok(benchmarkReport.succeeded)

      assert.ok(oldtestTokenReserves.lt(newtestTokenReserves) , "Tokens reserves increase")
      assert.ok(oldEthReserves.sub(etherVal.mul(count)).eq(newEthReserves) , "ETH Reserves decrease as expected")
      assert.ok(oldTestTokenPrice.gt(newTestTokenPrice), "Token quoted amount goes down after swaps")
    })
  })
})

describe('swapExactTokensForTokens tests', function() {
  it('handles swapExactTokensForTokens calls', async function() {
    const [oldtestTokenReserves,  oldArbTokenReserves] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)
    const oldTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)
    const count = 1
    return benchmarks.run([{
      method: swapExactTokensForTokensBytes,
      count,
      name: "swapExactTokensForTokens test",
      getNonce: () => signer.getTransactionCount()
    }]).then(async (benchmarkReport)=>{
      const [newtestTokenReserves, newArbTestTokenReserves  ] =  await  getReserves (contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)
      const newTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)
      assert.ok(benchmarkReport.succeeded)

      assert.ok(oldArbTokenReserves.gt(newArbTestTokenReserves) , "Token 2 reserves decrdase")
      assert.ok(oldtestTokenReserves.add(etherVal.mul(count)).eq(newtestTokenReserves) , "Token 1 reserves increase as expected")
      assert.ok(oldTestTokenPrice.lt(newTestTokenPrice), "Token 1 quoted amount goes up after swaps")
    })
  })
})



describe('swapTokensForExactTokens tests', function() {
  it('handles swapTokensForExactTokens calls', async function() {
    const [oldtestTokenReserves,  oldArbTokenReserves] = await  getReserves (contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)
    const oldTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)
    const count = 1
    return benchmarks.run([{
      method: swapTokensForExactTokensBytes,
      count,
      name: "swapTokensForExactTokens test",
      getNonce: () => signer.getTransactionCount()
    }]).then(async (benchmarkReport)=>{
      const [newtestTokenReserves, newArbTestTokenReserves  ] =  await  getReserves (contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)
      const newTestTokenPrice = await quotePrice( etherVal, contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)
      assert.ok(benchmarkReport.succeeded)

      assert.ok(oldtestTokenReserves.lt(newtestTokenReserves) , "Token 1 reserves increase")
      assert.ok(oldArbTokenReserves.sub(etherVal.mul(count)).eq(newArbTestTokenReserves) , "Token 2 reserves decrease as expected")
      assert.ok(oldTestTokenPrice.lt(newTestTokenPrice), "Token 1 quoted amount goes up after swaps")
    })
  })
})
