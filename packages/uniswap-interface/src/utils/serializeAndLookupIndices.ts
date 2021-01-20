
import { argSerializerConstructor } from 'arb-provider-ethers'
const serializeAndLookupIndices = argSerializerConstructor(process.env.REACT_APP_NETWORK_URL as string)
export default serializeAndLookupIndices 