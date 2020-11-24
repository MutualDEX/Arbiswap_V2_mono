
import { argSerializerConstructor } from 'arb-provider-ethers'
import { JsonRpcProvider } from 'ethers/providers'
const serializeAndLookupIndices = argSerializerConstructor(new JsonRpcProvider(process.env.REACT_APP_NETWORK_URL as string))
export default serializeAndLookupIndices 