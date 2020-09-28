import { ethers, Contract, utils, constants } from "ethers";
import { abi as IUniswapV2Router02ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
// import { abi as ERC20_ABI } from '@uniswap/v2-periphery/build/contracts/UniswapV2ERC20.json'
import { abi as ERC20_ABI } from '@uniswap/v2-core/build/contracts/UniswapV2ERC20.json'
import consts from './constants'

export const arbProvider = new ethers.providers.JsonRpcProvider(consts.arbProviderUrl);

const tokenAddress =  consts.tokenAddress;
const routerAddress =  consts.routerAddress;

const signer = new ethers.Wallet( 
    consts.walletKey, // key
    arbProvider )

const routerContract = new Contract(
    routerAddress, // router address
    IUniswapV2Router02ABI,
    signer
);
const tokenContract = new Contract(
    tokenAddress, 
    ERC20_ABI,
    signer
);


const addLiquidity = async ()=>{
    const etherVal =  utils.parseEther("10")
    const tokenVal = utils.parseEther("20")
    const tx  = await tokenContract.mint(signer.address, utils.parseEther("1000"))
    await tx.wait()

    const approveTx =  await tokenContract.approve(routerAddress, constants.MaxUint256.div(2))
    await approveTx.wait()


    routerContract.addLiquidityETH(
        tokenAddress,
        tokenVal, 
        tokenVal, 
        etherVal, 
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

addLiquidity()