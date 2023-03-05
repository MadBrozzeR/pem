const { Chunk } = require('../src/der/der.js');
const { OID } = require('../src/oid/oid.js');

function chunkCheck (suit, chunk, params) {
  const info = chunk.getInfo();
  const prefix = params.prefix || '';
  (params.type !== undefined) && suit.equals(chunk.type, params.type, prefix + 'Wrong type detection');
  (params.length !== undefined) && suit.equals(info.length, params.length, prefix + 'Wrong length detected');
  (params.instanceOf !== undefined) && suit.instanceOf(chunk.data, params.instanceOf, prefix + 'Wrong data instance');
  (params.value !== undefined) && suit.equals(
    chunk.data instanceof Buffer ? chunk.data.toString('hex') : chunk.data,
    params.value,
    prefix + 'Wrong value parsing'
  );
  (params.raw !== undefined) && suit.equals(chunk.raw.toString('hex'), params.raw, prefix + 'Wrong raw data detection');
}

module.exports = {
  'Correctly parses integer': function (resolve) {
    const { equals } = this;

    const data = Buffer.from('020220f3', 'hex');
    const chunk = Chunk.read(data);

    chunkCheck(this, chunk, {
      type: 2,
      length: 2,
      value: 0x20f3,
    });

    resolve();
  },
  'Correctly parses utf8 text': function (resolve) {
    const { equals } = this;

    const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
    const data = Buffer.from('0c8201bd4c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e6720656c69742c2073656420646f20656975736d6f642074656d706f7220696e6369646964756e74207574206c61626f726520657420646f6c6f7265206d61676e6120616c697175612e20557420656e696d206164206d696e696d2076656e69616d2c2071756973206e6f737472756420657865726369746174696f6e20756c6c616d636f206c61626f726973206e69736920757420616c697175697020657820656120636f6d6d6f646f20636f6e7365717561742e2044756973206175746520697275726520646f6c6f7220696e20726570726568656e646572697420696e20766f6c7570746174652076656c697420657373652063696c6c756d20646f6c6f726520657520667567696174206e756c6c612070617269617475722e204578636570746575722073696e74206f6363616563617420637570696461746174206e6f6e2070726f6964656e742c2073756e7420696e2063756c706120717569206f666669636961206465736572756e74206d6f6c6c697420616e696d20696420657374206c61626f72756d2e', 'hex');
    const chunk = Chunk.read(data);

    chunkCheck(this, chunk, {
      type: 0x0c,
      length: 445,
      value: text,
    });

    resolve();
  },
  'Correctly parses null': function (resolve) {
    const { equals } = this;

    const chunk = Chunk.read(Buffer.from('0500', 'hex'));

    chunkCheck(this, chunk, { value: null });

    resolve();
  },
  'Correctly parses objects': function (resolve) {
    const { equals } = this;

    const chunk = Chunk.read(Buffer.from('06092a864886f70d01010b', 'hex'));

    chunkCheck(this, chunk, { instanceOf: OID });
    equals(chunk.data.id, '1.2.840.113549.1.1.11', 'Wrong object detection');

    resolve();
  },
  'Correctly parses bit string': function (resolve) {
    const chunk = Chunk.read(Buffer.from('030900aabbccddeeff0011', 'hex'));

    chunkCheck(this, chunk, {
      instanceOf: Buffer,
      value: 'aabbccddeeff0011',
    });

    resolve();
  },
  'Correctly parses sequences and sets': function (resolve) {
    const data = '3019' +
      '3006' +
        '020100' +
        '020101' +
      '300f' +
        '3103' +
          '020110' +
        '3103' +
          '020111' +
        '3103' +
          '020112';
    const chunk = Chunk.read(Buffer.from(data, 'hex'));

    chunkCheck(this, chunk, {
      type: 0x30,
      length: 0x19,
      instanceOf: Array,
      raw: data,
      prefix: '[SEQ-301a] '
    });
    this.equals(chunk.data.length, 2, 'Wrong first level element length');

    chunkCheck(this, chunk.data[0], {
      type: 0x30,
      length: 6,
      instanceOf: Array,
      raw: '3006020100020101',
      prefix: '[SEQ-3006] '
    });
    this.equals(chunk.data[0].data.length, 2, 'Wrong second level element length');

    chunkCheck(this, chunk.data[1], {
      type: 0x30,
      length: 0xf,
      instanceOf: Array,
      raw: '300f310302011031030201113103020112',
      prefix: '[SEQ-300f] '
    });
    this.equals(chunk.data[1].data.length, 3, 'Wrong second level element length');

    chunkCheck(this, chunk.data[0].data[0], { value: 0, raw: '020100', prefix: '[NUM-00] ' });
    chunkCheck(this, chunk.data[0].data[1], { value: 1, raw: '020101', prefix: '[NUM-01] ' });

    chunkCheck(this, chunk.data[1].data[0], { type: 0x31, instanceOf: Array, raw: '3103020110', prefix: '[SET-1] ' });
    chunkCheck(this, chunk.data[1].data[1], { type: 0x31, instanceOf: Array, raw: '3103020111', prefix: '[SET-2] ' });
    chunkCheck(this, chunk.data[1].data[2], { type: 0x31, instanceOf: Array, raw: '3103020112', prefix: '[SET-3] ' });
    this.equals(chunk.data[1].data[0].data.length, 1, 'Wrong third level element length');
    this.equals(chunk.data[1].data[1].data.length, 1, 'Wrong third level element length');
    this.equals(chunk.data[1].data[2].data.length, 1, 'Wrong third level element length');

    chunkCheck(this, chunk.data[1].data[0].data[0], { value: 0x10, raw: '020110', prefix: '[NUM-10] ' });
    chunkCheck(this, chunk.data[1].data[1].data[0], { value: 0x11, raw: '020111', prefix: '[NUM-12] ' });
    chunkCheck(this, chunk.data[1].data[2].data[0], { value: 0x12, raw: '020112', prefix: '[NUM-12] ' });

    resolve();
  },

  'Correctly serializes to HEX': function (resolve) {
    const data = '3019' +
      '3006' +
        '020100' +
        '020101' +
      '300f' +
        '3103' +
          '020110' +
        '3103' +
          '020111' +
        '3103' +
          '020112';

    const chunk = Chunk.read(Buffer.from(data, 'hex'));

    this.equals(
      chunk.toHEX(),
      '30 19 30 06 02 01 00 02 01 01 30 0f 31 03 02 01\n10 31 03 02 01 11 31 03 02 01 12',
      'Wrong serialization with default parameters'
    );
    this.equals(
      chunk.toHEX({ width: 0 }),
      '30 19 30 06 02 01 00 02 01 01 30 0f 31 03 02 01 10 31 03 02 01 11 31 03 02 01 12',
      'Wrong one-line serialization'
    );
    this.equals(
      chunk.toHEX({ width: 8 }),
      '30 19 30 06 02 01 00 02\n01 01 30 0f 31 03 02 01\n10 31 03 02 01 11 31 03\n02 01 12',
      'Wrong serialization with width specified'
    );
    this.equals(
      chunk.toHEX({ length: 18 }),
      '30 19 30 06 02 01 00 02 01 01 30 0f 31 03 02 01\n10 31 ...',
      'Wrong serialization with length specified'
    );

    resolve();
  },

  'Correctly reads bit string as chunk': function (resolve) {
    const data = '030900' + '3006' + '020100' + '020101';

    const chunk = Chunk.read(Buffer.from(data, 'hex'));
    const result = chunk.readAsChunk();

    chunkCheck(this, result, { type: 0x30, length: 06, raw: '3006020100020101' });
    chunkCheck(this, result.data[0], { value: 0, raw: '020100' });
    chunkCheck(this, result.data[1], { value: 1, raw: '020101' });

    resolve();
  },

  'Corectly outputs debug information': function (resolve) {
    const data = '303c' +
      '3006' +
        '020100' +
        '020101' +
      '300f' +
        '3103' +
          '020110' +
        '3103' +
          '020111' +
        '3103' +
          '020112' +
      '3007' +
        '0603' +
          '550403' +
        '0500' +
      '3018' +
        '0609' +
          '2a864886f70d010101' +
        '0c0b' +
          '536f6d6520737472696e67';
    const result =
      '30 3c (SEQUENCE: 60)\n' +
      '  30 06 (SEQUENCE: 6)\n' +
      '    02 01 (INTEGER: 1)\n' +
      '      00 (0)\n' +
      '    02 01 (INTEGER: 1)\n' +
      '      01 (1)\n' +
      '  30 0f (SEQUENCE: 15)\n' +
      '    31 03 (SET: 3)\n' +
      '      02 01 (INTEGER: 1)\n' +
      '        10 (16)\n' +
      '    31 03 (SET: 3)\n' +
      '      02 01 (INTEGER: 1)\n' +
      '        11 (17)\n' +
      '    31 03 (SET: 3)\n' +
      '      02 01 (INTEGER: 1)\n' +
      '        12 (18)\n' +
      '  30 07 (SEQUENCE: 7)\n' +
      '    06 03 (OBJECT: 3)\n' +
      '      55 04 03 (2.5.4.3 [commonName])\n' +
      '    05 00 (NULL: 0)\n' +
      '  30 18 (SEQUENCE: 24)\n' +
      '    06 09 (OBJECT: 9)\n' +
      '      2a 86 48 86 f7 0d 01 01 01 (1.2.840.113549.1.1.1 [rsaEncryption])\n' +
      '    0c 0b (UTF8: 11)\n' +
      '      53 6f 6d 65 20 73 74 72 69 6e 67 (Some string)\n';

    const chunk = Chunk.read(Buffer.from(data, 'hex'));

    this.equals(chunk.debug(), result, 'Wrong data serialization');

    resolve();
  }
};
