import { ethers, Contract, utils, constants } from "ethers";
// import { abi as UniswapV2Router02ABI } from 'other_contracts/build/contracts/UniswapV2Router02.json'
import { abi as UniswapV2Router02ABI } from "other_contracts/build/contracts/IUniswapV2Router02.json";

import { abi as ERC20_ABI } from "@uniswap/v2-core/build/contracts/UniswapV2ERC20.json";
import consts from "./constants";
import { serializeParams, initSerializeAndLookUpIndices } from "@uniswap/sdk";
import { BenchmarkSuite } from "arb-benchmark-suite";

const { tokenAddress, routerAddress, ethProviderUrl, arbProviderUrl } = consts;

export const ethProvider = new ethers.providers.JsonRpcProvider(ethProviderUrl);
export const arbProvider = new ethers.providers.JsonRpcProvider(arbProviderUrl);
const serializeAndLookupIndices = initSerializeAndLookUpIndices(arbProviderUrl);

const signer = new ethers.Wallet(consts.walletKey, arbProvider);
console.info("Using address", signer.address);

const routerContract = new Contract(
  routerAddress,
  UniswapV2Router02ABI,
  signer
);
const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);

const approveAndFund = async () => {
  const tx = await tokenContract.mint(signer.address, utils.parseEther("1000"));
  await tx.wait();

  const approveTx = await tokenContract.approve(
    routerAddress,
    constants.MaxUint256.div(2)
  );
  await approveTx.wait();
  console.info("done");
};


const addLiquidityEthBytes = async (nonce) => {
  const etherVal = utils.parseEther("0.000000001");
  const tokenVal = utils.parseEther("0.000199999");

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

const swapExactETHForTokens = async () => {
  const etherVal = utils.parseEther("0.01");
  const tokenVal = utils.parseEther("2");

  const tx = await routerContract.swapExactETHForTokens(
    etherVal.toString(),
    ["0xe541e4C7888d25BF92EeD78134Ed6A9A77898254", consts.tokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
    {
      value: etherVal,
    }
  );
  console.info("res", tx);
  const res = await tx.wait();
  console.info(res);
  console.info("success!");
};

const swapExactETHForTokensBytes = async (nonce) => {
  const etherVal = utils.parseEther("0.0000001");

  const goodArgs = [
    etherVal.toString(),
    [consts.tokenAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 120000,
  ];
  const bytes = await serializeAndLookupIndices(goodArgs);

  return await routerContract["swapETHForExactTokens(bytes)"](bytes, {
    value: etherVal,
    nonce: nonce,
  });
};

const swapTokensForExactEthBytes = async (nonce) => {
  const etherVal = utils.parseEther("0.0001");
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

export const benchmarks = new BenchmarkSuite(
  ethProvider,
  arbProvider,
  "0x175c0b09453cbb44fb7f56ba5638c43427aa6a85"
);

benchmarks.run([
  {
    method: swapTokensForExactEthBytes,
    count: 1,
    name: "swapTokensForExactEthBytes test",
    getNonce: () => signer.getTransactionCount(),
     initBatch: approveAndFund
  },
]);


