import { isAddress } from '@ethersproject/address';
import { concat, hexZeroPad } from '@ethersproject/bytes';
import { BigNumber } from '@ethersproject/bignumber';


type PrimativeType = string | number | boolean | BigNumber


const formatPrimative = (value: PrimativeType)=>{    
    if (typeof value === 'string' &&  isAddress(value) ){
        return value;
    } else if (typeof value === 'boolean'){
        return new Uint8Array([value ? 1 : 0])
    } else if (typeof value === 'number' || +(value) || BigNumber.isBigNumber(value) )  {
        return hexZeroPad(BigNumber.from(value).toHexString(), 32)
    } else {
        throw new Error ('unsupported type')
    }   

}
export const serializeParams = (params: (PrimativeType | PrimativeType[])[]) => {
    const formattedParams: (string | Uint8Array) []  = [];

    params.forEach((param: PrimativeType | PrimativeType[])=>{
        if (Array.isArray(param)){
            formattedParams.push( new Uint8Array([param.length]));
            param.forEach((value)=>{
                formattedParams.push(
                    formatPrimative(value)
                )
            })
        } else {
            formattedParams.push(formatPrimative(param))
        }
    })
    return concat(formattedParams);

}



