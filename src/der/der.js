const { HEX } = require('../common/utils.js');
const { TYPES, TYPE_CONST } = require('./constants.js');
const { OID } = require('../oid/oid.js');
const {
  readOID,
  parseOID,
  getDataLength,
  // debugType,
  debugData,
  readChunkInfo,
  getBufferFromNumber,
} = require('./utils.js');

function Chunk (type, data) {
  this.type = type;
  this.data = null;

  if (data !== undefined) {
    this.set(data);
  }
}
/*
Chunk.prototype.toJSON = function () {
  return {
    type: debugType(this),
    data: this.data instanceof Buffer
      ? '[' + this.data.toString('hex') + ']'
      : this.data,
  };
}
*/
Chunk.prototype.toHEX = function (params) {
  return HEX(this.getRaw(), params);
}
Chunk.prototype.debug = function (spacer = '') {
  const info = this.getInfo();
  const header = this.raw.slice(0, info.header);

  return spacer + HEX(header, { width: 0 }) +
    ' (' + (TYPE_CONST[this.type] || '[???]') +
    ': ' + info.length + ')\n' +
    debugData(this.data, this, spacer + '  ');
}
Chunk.prototype.readAsChunk = function () {
  return Chunk.read(this.data);
}
Chunk.read = function (buffer) {
  const info = readChunkInfo(buffer);
  const chunk = new Chunk(info.type).setRawData(info.data);

  if (!chunk.validate(buffer)) {
    throw new Error(
      'Validation failed. Raw data mismatch.\n' +
        'RAW: ' + chunk.raw.toString('hex') + '\n' +
        'VAL: ' + buffer.toString('hex')
    );
  }

  return chunk;
}
Chunk.prototype.validate = function (buffer) {
  return this.raw.equals(buffer);
}
Chunk.prototype.parseData = function (buffer) {
  switch (this.type) {
    case TYPES.INTEGER:
      if (buffer === 7 && buffer[0] === 0) {
        return buffer.readUIntBE(1, 6);
      }
      if (buffer.length > 6) {
        return buffer;
      }
      return buffer.readIntBE(0, buffer.length);

    case TYPES.NULL:
      return null;

    case TYPES.SEQUENCE:
    case TYPES.SET:
      const result = [];

      for (let index = 0 ; index < buffer.length ; ) {
        const chunkInfo = readChunkInfo(buffer, index);
        result.push(
          new Chunk(chunkInfo.type)
            .setRawData(chunkInfo.data)
        );
        index += chunkInfo.total;
      }

      return result;

    case TYPES.IA5:
    case TYPES.T61:
    case TYPES.UTF8:
    case TYPES.PRINTABLE:
      return buffer.toString('utf8');

    case TYPES.OBJECT:
      return readOID(buffer);

    case TYPES.BIT:
      return buffer.slice(1);

    default:
      return buffer;
  }
}
Chunk.prototype.serialize = function (data) {
  switch (this.type) {
    case TYPES.INTEGER:
      if (data instanceof Buffer) {
        return data;
      }

      if (data.constructor !== Number) {
        throw 'Wrong data type for INTEGER type';
      }

      return getBufferFromNumber(data);

    case TYPES.NULL:
      return Buffer.alloc(0);

    case TYPES.BIT:
      if (!(data instanceof Buffer)) {
        throw new Error('Wrong data type. Buffer is required');
      }

      return Buffer.concat([
        Buffer.from([0]),
        data
      ], data.length + 1);

    case TYPES.OBJECT:
      if (!(data instanceof OID)) {
        throw new Error('Wrong data type. OID instance is required.')
      }

      return parseOID(data.id);

    case TYPES.PRINTABLE:
    case TYPES.UTF8:
      if (typeof data !== 'string') {
        throw new Error('Wrong data type. String is required');
      }

      return Buffer.from(data, 'utf8');

    case TYPES.SET:
    case TYPES.SEQUENCE:
      if (!(data instanceof Array)) {
        throw new Error('Wrong data type. Array of Chunk is required');
      }

      const result = [];
      let length = 0;

      for (let index = 0 ; index < data.length ; ++index) {
        if (data[index] instanceof Chunk) {
          const item = data[index].raw;
          length += item.length;
          result.push(item);
        }
      }

      return Buffer.concat(result, length);

    default:
      if (data instanceof Buffer) {
        return data;
      }
  }
}
Chunk.prototype.convert = function (data) {
  switch (this.type) {
    case TYPES.OBJECT:
      if (typeof data === 'string') {
        return new OID(data);
      }

      return data;

    default:
      return data;
  }
}
Chunk.prototype.set = function (data) {
  this.data = this.convert(data);
  this.raw = this.getRaw();

  return this;
}
Chunk.prototype.setRawData = function (buffer) {
  this.data = this.parseData(buffer);
  this.raw = this.getRaw();

  return this;
}
Chunk.prototype.getRaw = function () {
  const data = this.serialize(this.data);
  const length = getDataLength(data);
  const type = this.type;

  return Buffer.concat([
    Buffer.from([type]),
    length.raw,
    data
  ], length.value + length.raw.length + 1);
}
Chunk.prototype.getInfo = function () {
  return readChunkInfo(this.raw);
}
Chunk.TYPES = TYPES;
Chunk.Null = new Chunk(TYPES.NULL, null);

module.exports = { Chunk };
