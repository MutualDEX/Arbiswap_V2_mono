import { ethers, Contract, utils, constants } from "ethers";
// import { abi as UniswapV2Router02ABI } from 'other_contracts/build/contracts/UniswapV2Router02.json'
import { abi as UniswapV2Router02ABI } from "other_contracts/build/contracts/IUniswapV2Router02.json";
import { abi as IWETH } from "other_contracts/build/contracts/IWETH.json";
import { abi as IUniswapV2Pair } from "@uniswap/v2-core/build/contracts/IUniswapV2Pair.json";

import { abi as ERC20_ABI } from "@uniswap/v2-core/build/contracts/UniswapV2ERC20.json";
import consts from "./constants";
import { serializeParams, initSerializeAndLookUpIndices, contractAddresses, getPairAddressFromAddresses } from "@uniswap/sdk";
import { BenchmarkSuite, Report } from "arb-benchmark-suite";

const { tokenAddress, routerAddress, ethProviderUrl, arbProviderUrl } = consts;

export const ethProvider = new ethers.providers.JsonRpcProvider(ethProviderUrl);
export const arbProvider = new ethers.providers.JsonRpcProvider(arbProviderUrl);
const serializeAndLookupIndices = initSerializeAndLookUpIndices(arbProviderUrl);

export const signer = new ethers.Wallet(consts.walletKey, arbProvider);
console.info("Using address", signer.address);

const routerContract = new Contract(
  routerAddress,
  UniswapV2Router02ABI,
  signer
);

const wethContract = new Contract(
  contractAddresses.wethAddress,
  IWETH,
  signer
);
export const etherVal = utils.parseEther("0.0001");

// required input for an exact output
const getAmountIn = async ( exactAmountOut: utils.BigNumber, inAddress: string, outAddress:string )=>{
  const [inReserves, outReserves] = await getReserves(inAddress,outAddress)
  return await routerContract.getAmountIn(exactAmountOut, inReserves, outReserves)
}


// max output for an exact input
const getAmountOut =  async (exactAmountIn: utils.BigNumber, inAddress: string, outAddress:string)=>{
  const [inReserves, outReserves] = await getReserves(inAddress,outAddress)
  return await routerContract.getAmountOut(exactAmountIn, inReserves, outReserves)
}

export const getReserves = (()=>{
  const pairMemo = {}
  return async (tokenAAddress: string, tokenBAddress: string)=>{
    let pairContract: ethers.Contract;

    const addressConcat = [tokenBAddress, tokenBAddress].sort().join("")
    if (pairMemo[addressConcat]){
      pairContract = pairMemo[addressConcat]
    } else {
        const pairAddress = getPairAddressFromAddresses(tokenAAddress, tokenBAddress)
        pairContract = new Contract(pairAddress, IUniswapV2Pair, signer)



    }
    try {
      const [tokenAReserves, tokenBReserves]:[ethers.utils.BigNumber, ethers.utils.BigNumber]  = await pairContract.getReserves()
      const firstAddress = await pairContract.token0();
      const [testTokenReserves, wethReserves] = firstAddress === tokenBAddress ? [tokenBReserves, tokenAReserves] : [tokenAReserves, tokenBReserves]



      return [testTokenReserves, wethReserves]
    } catch{
      console.warn('reserves not found');

      return null

    }

  }

})()


export const quotePrice = async (amountToken: ethers.utils.BigNumber, tokenAAddress: string, tokenBAddress: string, inputAmountIsFirst = false)=>{
  const [tokenAReserves, tokenBReserves] = await getReserves(tokenAAddress, tokenBAddress)

  // quote(uint amountA, uint reserveA, uint reserve)

  const price: ethers.utils.BigNumber =  inputAmountIsFirst ? await routerContract.quote(amountToken, tokenAReserves, tokenBReserves) : await routerContract.quote(amountToken, tokenBReserves, tokenAReserves)

  return price

}

const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
const tokenContract2 = new Contract(contractAddresses.arbTokenAddress, ERC20_ABI, signer);


const approveAndFund = async (tokenContract: Contract) => {
  const targetTokenBalance = utils.parseEther("100000")

  const bal:ethers.utils.BigNumber = await tokenContract.balanceOf(signer.address);

  if (bal.lt(targetTokenBalance)){
    console.info("Minting tokens for ", signer.address)
    const tx = await tokenContract.mint(signer.address, utils.parseEther("10000000000000000"));

    await tx.wait();
    console.info("Done minting")
  } else {
    console.info("Address has ", utils.formatEther(bal), "tokens" )
  }

  const allowance:ethers.utils.BigNumber  = await tokenContract.allowance(signer.address, routerAddress)

  if (allowance.isZero()){
    console.info("Setting token allowance for address ")
    const approveTx = await tokenContract.approve(
      routerAddress,
      constants.MaxUint256.div(2)
    );
    await approveTx.wait();
  } else {
    console.info('Token allowance already set')
  }
} 



export const setup = async () => {
  await approveAndFund(tokenContract)
  await approveAndFund(tokenContract2)

  let  reserves  = await getReserves(contractAddresses.testTokenAddress, contractAddresses.wethAddress)

  if (!reserves){
    console.info('initializing token pair')
    const res = await createInitialWethTokenPair()
    console.info(res.status === 1 ? 'token pair created': 'failed to create token pair')

  } else {
    console.info('Token pair already created')
  }

  reserves =  await getReserves(contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)
  if (!reserves){
    console.info('initializing token token pair')
    const res = await createInitialTokenTokenPair()
    console.info(res.status === 1 ? 'token pair created': 'failed to create token pair')

  } else {
    console.info('Token pair already created')
  }
  console.info("Done setting up")
  console.info("");

};


export const createInitialTokenTokenPair = async ()=>{
  const tokenVal =  etherVal.mul(10)
  const args = [
    tokenAddress,
    contractAddresses.arbTokenAddress,
    tokenVal.toString(),
    tokenVal.toString(),
    tokenVal.mul(995).div(1000).toString(),
    tokenVal.mul(995).div(1000).toString(),
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ]


  const tx = await routerContract.addLiquidity(...args, {
    nonce: await signer.getTransactionCount()
  });

  return await  tx.wait()
}


export const createInitialWethTokenPair = async ()=>{
  const ethVal = utils.parseEther('0.1')
  const tokenVal =  ethVal
  const args = [
    tokenAddress,
    tokenVal.toString(),
    tokenVal.mul(995).div(1000).toString(),
    ethVal.mul(995).div(1000).toString(),
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ]

  const bytes = await serializeAndLookupIndices(args);

  const tx = await routerContract.addLiquidityETH(bytes, {
    value: new ethers.utils.BigNumber(ethVal),
    nonce: await signer.getTransactionCount()
  });

  return await  tx.wait()
}

export const addLiquidityEthBytes = async (nonce) => {

  const tokenVal =  await quotePrice(etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)
  const args = [
    tokenAddress,
    tokenVal.toString(),
    tokenVal.mul(995).div(1000).toString(),
    etherVal.mul(995).div(1000).toString(),
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ]

  const bytes = await serializeAndLookupIndices(args);

  return routerContract.addLiquidityETH(bytes, {
    value: new ethers.utils.BigNumber(etherVal),
    nonce
  });
};

export const removeLiquidityEth = async (nonce) => {

  const tokenVal =  await quotePrice(etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)
  const args = [
    tokenAddress,
    new utils.BigNumber(1).toString(),
    tokenVal.mul(1).div(1000).toString(),
    etherVal.mul(1).div(1000).toString(),
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ]


  return routerContract.removeLiquidityETH(...args, {
    value: new ethers.utils.BigNumber(etherVal),
    nonce
  });
};


export const addLiquidityEthBytesRevert = async (nonce) => {

  const tokenVal = await (await quotePrice(etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)).div(2)

  const bytes = await serializeAndLookupIndices([
    tokenAddress,
    tokenVal.toString(),
    tokenVal.toString(),
    etherVal.toString(),
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ]);

  return routerContract.addLiquidityETH(bytes, {
    value: new ethers.utils.BigNumber(etherVal),
    nonce,
  });
};


export const swapExactETHForTokensBytes = async (nonce) => {
  const tokenAmmount   = await getAmountOut (etherVal, contractAddresses.wethAddress, contractAddresses.testTokenAddress)
  const goodArgs = [
    tokenAmmount,
    [consts.tokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ];
  const bytes = await serializeAndLookupIndices(goodArgs);

  return await routerContract["swapExactETHForTokens(bytes)"](bytes, {
    value: etherVal,
    nonce,
  });
};

export const swapETHForExactTokensBytes = async (nonce) => {
  const tokensVal = etherVal
  const ethAmmount = await getAmountIn(tokensVal, contractAddresses.wethAddress, contractAddresses.testTokenAddress )
  const goodArgs = [
    tokensVal.toString(),
    [consts.tokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ];
  const bytes = await serializeAndLookupIndices(goodArgs);
  const tx =  await routerContract["swapETHForExactTokens(bytes)"](bytes, {
    value: ethAmmount,
    nonce,
  });

  return  tx
};

// export const swapExactTokensForETH = async (nonce) => {

//   const goodArgs = [
//     etherVal.toString(),
//     [consts.tokenAddress],
//     signer.address,
//     Math.ceil(Date.now() / 1000) + 120000,
//   ];
//   const bytes = await serializeAndLookupIndices(goodArgs);

//   return await routerContract["swapExactTokensForETH(bytes)"](bytes, {
//     value: etherVal,
//     nonce,
//   });
// };

export const swapTokensForExactEthBytes = async (nonce) => {
  const tokenVal = await getAmountIn(etherVal,  contractAddresses.testTokenAddress, contractAddresses.wethAddress)

  const goodArgs = [
    etherVal.toString(),
    tokenVal.toString(),
    [consts.tokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ];
  const bytes = await serializeAndLookupIndices(goodArgs);

  return await routerContract["swapTokensForExactETH(bytes)"](bytes, {
    nonce,
  });
};

export const swapExactTokensForTokensBytes = async (nonce) => {
  const testTokenVal = etherVal
  const arbTokenVal = await getAmountOut(testTokenVal,  contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)

  const goodArgs = [
    testTokenVal.toString(),
    arbTokenVal.toString(),
    [consts.tokenAddress,contractAddresses.arbTokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ];
  const bytes = await serializeAndLookupIndices(goodArgs);

  return await routerContract["swapExactTokensForTokens(bytes)"](bytes, {
    nonce,
  });
};


export const swapTokensForExactTokensBytes = async (nonce) => {
  const arbTokenVal = etherVal
  const testTokenVal = await getAmountIn(arbTokenVal,  contractAddresses.testTokenAddress, contractAddresses.arbTokenAddress)

  const goodArgs = [
    arbTokenVal.toString(),
    testTokenVal.toString(),
    [consts.tokenAddress,contractAddresses.arbTokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ];
  const bytes = await serializeAndLookupIndices(goodArgs);

  return await routerContract["swapTokensForExactTokens(bytes)"](bytes, {
    nonce,
  });
};

// const swapTokensForExactEth = async (nonce) => {
//   const etherVal = utils.parseEther("0.00001");
//   const tokenVal = utils.parseEther("200");

//   const goodArgs = [
//     etherVal.toString(),
//     tokenVal.toString(),
//     [consts.tokenAddress, contractAddresses.wethAddress],
//     signer.address,
//     Math.ceil(Date.now() / 1000) + 120000
//   ];y


//   return await routerContract["swapTokensForExactETH(uint256,uint256,address[],address,uint256)"](...goodArgs, {
//     nonce: nonce,
//     gasLimit: 5000000
//   });
// };


// const depositWETH = async(nonce)=>{
//   return await wethContract.deposit({value: utils.parseEther("0.001"), nonce})
// }

// const withdrawWeth = async(nonce)=>{
//   return await wethContract.withdraw(utils.parseEther("0.00001"), {nonce})
// }
setup()
export const benchmarks = new BenchmarkSuite(
  ethProvider,
  arbProvider,
  "0xc68DCee7b8cA57F41D1A417103CB65836E99e013"
)
// arbProvider.getBalance(contractAddresses.wethAddress).then(console.log)

