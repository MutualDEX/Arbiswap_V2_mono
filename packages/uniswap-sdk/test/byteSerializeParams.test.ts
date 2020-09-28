import {serializeParams}  from '../src/byteSerializeParams'

  describe('serializeParams', () => {
      it('returns bytes array of correct length', () => {
        const res = serializeParams([true, "0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F",["0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F", "0x38299D74a169e68df4Da85Fb12c6Fd22246aDD9F"], "1", "2" ])        
        expect(res.length).toEqual(126)
      })
    })
  