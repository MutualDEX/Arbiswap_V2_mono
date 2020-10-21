
import { initSerializeAndLookUpIndices } from '@uniswap/sdk'

const serializeAndLookupIndices = initSerializeAndLookUpIndices(process.env.REACT_APP_NETWORK_URL as string)
export default serializeAndLookupIndices 