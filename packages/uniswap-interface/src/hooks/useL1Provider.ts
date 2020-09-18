import { useMemo } from 'react'
import { ethers } from 'ethers'

export default function useL1Provider (url:string) {
    return useMemo(()=>{
        return new ethers.providers.JsonRpcProvider(url)
    }, [url])
}