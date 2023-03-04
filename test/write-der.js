const { WChunk } = require("../src/der/writer.js");
const { OID } = require("../src/oid/oid.js");

function chunkCheck (suit, chunk, params) {
  // (params.data !== undefined) && suit.equals(chunk.getRawData().toString('hex'), params.data, 'Wrong data serialization');
  (params.raw !== undefined) && suit.equals(chunk.getRaw().toString('hex'), params.raw, 'Wrong raw data conversion');
};
function getBuffer (hex) {
  return Buffer.from(hex, 'hex');
}

module.exports = {
  'Get data from integer WChunk': function (resolve) {
    const type = WChunk.TYPES.INTEGER;

    chunkCheck(this, new WChunk(type, 127), { raw: '02017f' });
    chunkCheck(this, new WChunk(type, 128), { raw: '02020080' });
    chunkCheck(this, new WChunk(type, 0x7fffffffffff), { raw: '02067fffffffffff' });
    chunkCheck(this, new WChunk(type, 0xffffffffffff), { raw: '020700ffffffffffff' });

    resolve();
  },
  'Get data from NULL WChunk': function (resolve) {
    chunkCheck(this, new WChunk(WChunk.TYPES.NULL, null), { raw: '0500' });

    resolve();
  },
  'Get data from bit string WChunk': function (resolve) {
    const type = WChunk.TYPES.BIT;

    chunkCheck(this, new WChunk(type, getBuffer('ff00aa33')), { raw: '030500ff00aa33' });

    resolve();
  },
  'Get data from object WChunk': function (resolve) {
    const type = WChunk.TYPES.OBJECT;

    chunkCheck(this, new WChunk(type, new OID('1.2.840.113549.1.1.1')), { raw: '06092a864886f70d010101' })
    chunkCheck(this, new WChunk(type, new OID('2.5.4.3')), { raw: '0603550403' });

    resolve();
  },
  'Get data from UTF8 string WChunk': function (resolve) {
    const type = WChunk.TYPES.UTF8;

    chunkCheck(this, new WChunk(type, 'Some string'), { raw: '0c0b536f6d6520737472696e67' })

    resolve();
  },
  'Get data from sequence and set': function (resolve) {
    chunkCheck(this, new WChunk(WChunk.TYPES.SEQUENCE, [
      new WChunk(WChunk.TYPES.SET, [
        new WChunk(WChunk.TYPES.INTEGER, 12)
      ]),
      new WChunk(WChunk.TYPES.SET, [
        new WChunk(WChunk.TYPES.UTF8, 'text')
      ])
    ]), { raw: '300d310302010c31060c0474657874' });
  }
};
