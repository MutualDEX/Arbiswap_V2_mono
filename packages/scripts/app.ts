import { ethers, Contract, utils, constants } from "ethers";
import { abi as UniswapV2Router02ABI } from 'other_contracts/build/contracts/UniswapV2Router02.json'
import { abi as ERC20_ABI } from '@uniswap/v2-core/build/contracts/UniswapV2ERC20.json'
import consts from './constants'
import { serializeParams } from '@uniswap/sdk';

export const arbProvider = new ethers.providers.JsonRpcProvider(consts.arbProviderUrl);

const { tokenAddress, routerAddress } = consts

const signer = new ethers.Wallet( 
    consts.walletKey, // key
    arbProvider )

const routerContract = new Contract(
    routerAddress, // router address
    UniswapV2Router02ABI,
    signer
);
const tokenContract = new Contract(
    tokenAddress, 
    ERC20_ABI,
    signer
);

const approveAndFund = async  ()=>{
    const tx  = await tokenContract.mint(signer.address, utils.parseEther("1000"))
    await tx.wait()

    const approveTx =  await tokenContract.approve(routerAddress, constants.MaxUint256.div(2))
    await approveTx.wait()
}

const addLiquidity = async ()=>{
    await approveAndFund()
    const etherVal =  utils.parseEther("0.1")
    const tokenVal = utils.parseEther("20")


    routerContract.addLiquidityETH(
        tokenAddress,
        tokenVal.toString(), 
        tokenVal.toString(), 
        etherVal.toString(), 
        signer.address,
        Math.ceil(Date.now() / 1000) + 120000,  
        {
            value: new ethers.utils.BigNumber(etherVal)
        } 
    ).then((tx)=> {
        console.info('response:');
        console.info(tx);
        
        tx.wait().then((receipt)=>{
            console.info('success!')
            console.info(receipt);

        }).catch((err)=>{
            console.warn(err);
        })
    })

}


const addLiquidityBytes = async ()=>{
    await approveAndFund()
    const etherVal =  utils.parseEther("0.1")
    const tokenVal = utils.parseEther("20")


    const bytes = serializeParams([
        tokenAddress,
        tokenVal.toString(), 
        tokenVal.toString(), 
        etherVal.toString(), 
        signer.address,
        Math.ceil(Date.now() / 1000) + 120000
    ])
    routerContract.addLiquidityETHBytes(bytes,  
        {
            value: new ethers.utils.BigNumber(etherVal)
        } 
    ).then((tx)=> {
        console.info('response:');
        console.info(tx);
        
        tx.wait().then((receipt)=>{
            console.info(receipt);
            console.info('success!!')

        }).catch((err)=>{
            console.warn(err);
        })
    })

}

const swapExactETHForTokens = async ()=>{
    // await approveAndFund()
    const etherVal =  utils.parseEther("0.01")
    const tokenVal = utils.parseEther("2")

    const tx = await  routerContract.swapExactETHForTokens(
        etherVal.toString(),
        ["0xe541e4C7888d25BF92EeD78134Ed6A9A77898254", consts.tokenAddress],
        signer.address, 
        Math.ceil(Date.now() / 1000) + 120000,
       {
            value: etherVal
        }
    )
    console.info('res', tx)
    const res = await tx.wait()
    console.info(res)
    console.info('success!')


} 


const swapExactETHForTokensBytes = async ()=>{
    // await approveAndFund()
    const etherVal =  utils.parseEther("0.01")
    const tokenVal = utils.parseEther("2")

    const tx = await  routerContract.swapExactETHForTokensBytes(
        serializeParams([
        etherVal.toString(),
        [consts.tokenAddress],
        signer.address, 
        Math.ceil(Date.now() / 1000) + 120000,
        ]),
       {
            value: etherVal
        }
    )
    console.info('res', tx)
    const res = await tx.wait()
    console.info(res)
    console.info('success!')


} 
// swapExactETHForTokens()
// swapExactETHForTokensBytes()
addLiquidityBytes()