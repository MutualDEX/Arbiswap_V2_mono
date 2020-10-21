import { serializeParams } from '../src/byteSerializeParams'

describe('serializeParams', () => {
  it('returns bytes array of correct length', async () => {
    const  res = await serializeParams([
      true,
      '0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F',
      ['0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F', '0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F'],
      '1',
      '2'
    ])
    expect(res.length).toEqual(128)
  })

  it('returns bytes array of correct length when addresses are indexed', async () => {
    const  res = await serializeParams([
      true,
      '0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F',
      ['0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F', '0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F'],
      '1',
      '2'
    ], ()=>(new Promise((exec)=>exec(42))))
    expect(res.length).toEqual(80)
  })

  it('returns bytes array of correct length when only 1 address is indexed', async () => {
    const  res = await serializeParams([
      ['0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F', '0x7363EB6D7ebFB0EcbF80F9d15688CfBf8D7EF191'],
    ],
     (str)=>{ 
      return new Promise((exec)=>exec(str === "0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F" ? 1 : -1))   
      }
    )
    expect(res.length).toEqual(42)
  })
  
})
