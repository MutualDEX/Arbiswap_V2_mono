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
    // ... returns testtoken, weth
    const [tokenAReserves, tokenBReserves]:[ethers.utils.BigNumber,ethers.utils.BigNumber]  = await pairContract.getReserves()
    console.warn( await pairContract.token0());
    
    return [tokenAReserves, tokenBReserves]
  }
  
})()


export const quotePrice = async (amountToken: ethers.utils.BigNumber, tokenAAddress: string, tokenBAddress: string, inputAmountIsFirst = false)=>{
  const [tokenAReserves, tokenBReserves] = await getReserves(tokenAAddress, tokenBAddress)
  
  // quote(uint amountA, uint reserveA, uint reserve)

  const price: ethers.utils.BigNumber =  inputAmountIsFirst ? await routerContract.quote(amountToken, tokenAReserves, tokenBReserves) : await routerContract.quote(amountToken, tokenBReserves, tokenAReserves)
  
  return price
  
}

const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);

export const approveAndFund = async () => {
  const targetTokenBalance = utils.parseEther("1000")

  const bal:ethers.utils.BigNumber = await tokenContract.balanceOf(signer.address);

  if (bal.lt(targetTokenBalance)){
    console.info("Minting tokens for ", signer.address)
    const tx = await tokenContract.mint(signer.address, utils.parseEther("1000"));

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


  console.info("Done setting up tokens");
  console.info("");

};



export const addLiquidityEthBytes = async (nonce) => {
  const tokenVal = await quotePrice(etherVal, contractAddresses.testTokenAddress, contractAddresses.wethAddress)
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
    nonce,
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

  const goodArgs = [
    etherVal.toString(),
    [consts.tokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ];
  const bytes = await serializeAndLookupIndices(goodArgs);

  return await routerContract["swapExactETHForTokens(bytes)"](bytes, {
    value: etherVal,
    nonce: nonce,
  });
};

export const swapETHForExactTokensBytes = async (nonce) => {
  const tokensVal = etherVal 

  const goodArgs = [
    tokensVal.toString(),
    [consts.tokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ];
  const bytes = await serializeAndLookupIndices(goodArgs);

  return await routerContract["swapETHForExactTokens(bytes)"](bytes, {
    value: etherVal,
    nonce,
  });
};

export const swapExactTokensForETH = async (nonce) => {

  const goodArgs = [
    etherVal.toString(),
    [consts.tokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ];
  const bytes = await serializeAndLookupIndices(goodArgs);

  return await routerContract["swapExactTokensForETH(bytes)"](bytes, {
    value: etherVal,
    nonce,
  });
};

const swapTokensForExactEthBytes = async (nonce) => {
  const tokenVal = utils.parseEther("200");

  const goodArgs = [
    etherVal.toString(),
    tokenVal.toString(),
    [consts.tokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ];
  const bytes = await serializeAndLookupIndices(goodArgs);
  
  return await routerContract["swapTokensForExactETH(bytes)"](bytes, {
    value: etherVal,
    nonce: nonce,
  });
};

const swapTokensForExactEth = async (nonce) => {
  const etherVal = utils.parseEther("0.00001");
  const tokenVal = utils.parseEther("200");

  const goodArgs = [
    etherVal.toString(),
    tokenVal.toString(),
    [consts.tokenAddress, contractAddresses.wethAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000
  ];
  
  
  return await routerContract["swapTokensForExactETH(uint256,uint256,address[],address,uint256)"](...goodArgs, {
    nonce: nonce,
    gasLimit: 5000000
  });
};


const depositWETH = async(nonce)=>{
  return await wethContract.deposit({value: utils.parseEther("0.001"), nonce})
}

const withdrawWeth = async(nonce)=>{
  return await wethContract.withdraw(utils.parseEther("0.00001"), {nonce})
}



export const benchmarks = new BenchmarkSuite(
  ethProvider,
  arbProvider,
  "0x175c0b09453cbb44fb7f56ba5638c43427aa6a85"
);
