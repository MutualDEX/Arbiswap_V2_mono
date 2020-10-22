import { useMemo } from 'react'
import { ethers as ethers_old } from 'ethers-old'
import { ethers } from 'ethers'

export function useL1Provider4 (url:string) {
    return useMemo(()=>{
        return new ethers_old.providers.JsonRpcProvider(url)
    }, [url])
}

export function useL1Provider5 (url:string) {
    return useMemo(()=>{
        return new ethers.providers.JsonRpcProvider(url)
    }, [url])
}