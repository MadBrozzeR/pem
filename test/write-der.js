const { Chunk } = require("../src/der/der.js");
const { OID } = require("../src/oid/oid.js");

function chunkCheck (suit, chunk, params) {
  (params.raw !== undefined) && suit.equals(chunk.raw.toString('hex'), params.raw, 'Wrong raw data conversion');
};
function getBuffer (hex) {
  return Buffer.from(hex, 'hex');
}

module.exports = {
  'Get data from integer Chunk': function (resolve) {
    const type = Chunk.TYPES.INTEGER;

    chunkCheck(this, new Chunk(type, 127), { raw: '02017f' });
    chunkCheck(this, new Chunk(type, 128), { raw: '02020080' });
    chunkCheck(this, new Chunk(type, 0x7fffffffffff), { raw: '02067fffffffffff' });
    chunkCheck(this, new Chunk(type, 0xffffffffffff), { raw: '020700ffffffffffff' });

    resolve();
  },
  'Get data from NULL Chunk': function (resolve) {
    chunkCheck(this, new Chunk(Chunk.TYPES.NULL, null), { raw: '0500' });

    resolve();
  },
  'Get data from bit string Chunk': function (resolve) {
    const type = Chunk.TYPES.BIT;

    chunkCheck(this, new Chunk(type, getBuffer('ff00aa33')), { raw: '030500ff00aa33' });

    resolve();
  },
  'Get data from object Chunk': function (resolve) {
    const type = Chunk.TYPES.OBJECT;

    chunkCheck(this, new Chunk(type, new OID('1.2.840.113549.1.1.1')), { raw: '06092a864886f70d010101' })
    chunkCheck(this, new Chunk(type, new OID('2.5.4.3')), { raw: '0603550403' });

    resolve();
  },
  'Get data from UTF8 string Chunk': function (resolve) {
    const type = Chunk.TYPES.UTF8;

    chunkCheck(this, new Chunk(type, 'Some string'), { raw: '0c0b536f6d6520737472696e67' })

    resolve();
  },
  'Get data from sequence and set': function (resolve) {
    chunkCheck(this, new Chunk(Chunk.TYPES.SEQUENCE, [
      new Chunk(Chunk.TYPES.SET, [
        new Chunk(Chunk.TYPES.INTEGER, 12)
      ]),
      new Chunk(Chunk.TYPES.SET, [
        new Chunk(Chunk.TYPES.UTF8, 'text')
      ])
    ]), { raw: '300d310302010c31060c0474657874' });

    resolve();
  }
};
