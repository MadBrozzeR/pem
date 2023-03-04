const { Writer } = require('mbr-buffer');
const { OID } = require('../oid/oid.js');
const { TYPES } = require('./constants.js');
const { getBufferFromNumber, getLength, parseOID } = require('./utils.js');

function WChunk (type, data) {
  this.type = type & 0b00111111;
  this.typeClass = type & 0b11000000;
  this.data = data;
  this.rawData = null;
}
WChunk.prototype.setRawData = function (data) {
  return this.rawData = data;
}
WChunk.prototype.getRawData = function () {
  if (this.rawData) {
    return this.rawData;
  }

  switch (this.type) {
    case TYPES.INTEGER:
      if (this.data instanceof Buffer) {
        return this.setRawData(this.data);
      }

      if (this.data.constructor !== Number) {
        throw 'Wrong data type for INTEGER type';
      }

      return this.setRawData(getBufferFromNumber(this.data));

    case TYPES.NULL:
      return this.setRawData(Buffer.alloc(0));

    case TYPES.BIT:
      if (!(this.data instanceof Buffer)) {
        throw new Error('Wrong data type. Buffer is required');
      }

      return this.setRawData(Buffer.concat([
        Buffer.from([0]),
        this.data
      ], this.data.length + 1));

    case TYPES.OBJECT:
      if (!(this.data instanceof OID)) {
        throw new Error('Wrong data type. OID instance is required.')
      }

      return this.setRawData(parseOID(this.data.id));

    case TYPES.PRINTABLE:
    case TYPES.UTF8:
      if (typeof this.data !== 'string') {
        throw new Error('Wrong data type. String is required');
      }

      return this.setRawData(Buffer.from(this.data, 'utf8'));

    case TYPES.SET:
    case TYPES.SEQUENCE:
      if (!(this.data instanceof Array)) {
        throw new Error('Wrong data type. Array of WChunk is required');
      }

      const result = [];
      let length = 0;

      for (let index = 0 ; index < this.data.length ; ++index) {
        if (this.data[index] instanceof WChunk) {
          const data = this.data[index].getRaw();
          length += data.length;
          result.push(data);
        }
      }

      return this.setRawData(Buffer.concat(result, length));

    default:
      if (this.data instanceof Buffer) {
        return this.setRawData(this.data);
      }
  }
}
WChunk.prototype.getRaw = function () {
  const data = this.getRawData();
  const length = getLength(data);

  return Buffer.concat([
    Buffer.from([this.type | this.typeClass]),
    length.raw,
    data
  ], length.value + length.raw.length + 1);
}
WChunk.TYPES = TYPES;

module.exports = { WChunk };
