const { Reader } = require('mbr-buffer');
const { HEX } = require("../common/utils.js");
const { OID } = require('../oid/oid.js');
const { TYPES, TYPE_CONST } = require('./constants.js');

function debugType (chunk) {
  return '[' +
    chunk.typeByte.toString(16) +
    '] ' +
    TYPE_CONST[chunk.type];
}

function debugData (data, chunk, spacer = '') {
  const Chunk = chunk.constructor;

  if (data instanceof Array) {
    let result = '';

    for (let index = 0 ; index < data.length ; ++index) {
      result += debugData(data[index], chunk, spacer);
    }

    return result;
  }

  if (data === null) {
    return '';
  }

  if (data instanceof Chunk) {
    return data.debug(spacer);
  }

  if (data instanceof Buffer) {
    return chunk.rawData.length
      ? spacer + HEX(chunk.rawData, { length: 32, width: 0 }) + '\n'
      : '';
  }

  if (data instanceof OID) {
    return spacer + HEX(chunk.rawData, { length: 32, width: 0}) +
      ' (' + data.toString() + ')\n';
  }

  return spacer + HEX(chunk.rawData, { length: 32, width: 0 }) +
    ' (' + data + ')\n';
}

function readOID (reader) {
  let result = '';

  const first = reader.readUIntBE(1);
  result += Math.floor(first / 40);
  result += '.' + first % 40;
  let big = 0;

  while (!reader.isEndReached()) {
    const byte = reader.readUIntBE(1);

    if (byte & 0x80) {
      big = (big | (byte & 0x7f)) << 7
    } else {
      if (big) {
        big = big | byte;
        result += '.' + big;
        big = 0;
      } else {
        result += '.' + byte;
      }
    }
  }

  return new OID(result);
}

function parseOID (oid) {
  const numbers = oid.split('.');
  const bytes = [
    parseInt(numbers[0], 10) * 40 + parseInt(numbers[1], 10)
  ];
  let current;

  for (let index = 2 ; index < numbers.length ; ++index) {
    current = parseInt(numbers[index], 10);

    if (current < 128) {
      bytes.push(current);
    } else {
      const stack = [];

      while (current > 0) {
        let value = current & 0x7f;

        if (stack.length) {
          value = value | 0x80;
        }

        stack.push(value);
        current = current >> 7;
      }

      for (let stackIndex = stack.length - 1 ; stackIndex >= 0 ; --stackIndex) {
        bytes.push(stack[stackIndex]);
      }
    }
  }

  return Buffer.from(bytes);
}

function parseData (chunk) {
  const Chunk = chunk.constructor;

  const reader = new Reader(chunk.rawData);
  const length = chunk.length.value;

  switch (chunk.type) {
    case TYPES.INTEGER:
      if (length > 8) {
        return chunk.rawData;
      }

      return reader.readIntBE(length);

    case TYPES.NULL:
      return null;

    case TYPES.SEQUENCE:
    case TYPES.SET:
      const result = [];

      while (!reader.isEndReached()) {
        result.push(new Chunk(reader, chunk));
      }

      return result;

    case TYPES.IA5:
    case TYPES.T61:
    case TYPES.UTF8:
      return reader.read(length);

    case TYPES.OBJECT:
      return readOID(reader);

    case TYPES.BIT:
      return chunk.rawData.slice(1);

    default:
      return chunk.rawData;
  }
}

function readLength (reader) {
  const first = reader.readUIntBE(1);

  if (first & 0x80) {
    const length = first & 0x7f;

    if (length > 8) {
      throw new Error('Data length > 8 bytes is not supported yet. Given length is ' + length + ' bytes');
    }

    return {
      raw: reader.buffer.slice(reader.index - 1, reader.index + length),
      value: reader.readUIntBE(length),
    }
  }

  return {
    raw: reader.buffer.slice(reader.index - 1, reader.index),
    value: first
  };
}

function getBufferFromNumber (number, { ignoreLeadingZero = false } = {}) {
  const isNegative = number < 0;
  const buffer = Buffer.alloc(7);
  buffer.writeUIntBE(Math.abs(number), 1, 6);

  if (isNegative) {
    throw new Error('Negative numbers are not supported yet');
  }

  for (let index = 0 ; index < buffer.length ; ++index) {
    if (buffer[index] === 0) {
      continue;
    }

    if (buffer[index] > 127 && !ignoreLeadingZero) {
      return buffer.slice(index - 1);
    }

    return buffer.slice(index);
  }
}

function getLength (data) {
  const value = data.length;
  const result = [];

  if (value < 128) {
    return {
      value: value,
      raw: Buffer.from([value])
    };
  }

  const buffer = getBufferFromNumber(value, { ignoreLeadingZero: true });

  return {
    value: value,
    raw: Buffer.concat([
      Buffer.from([0x80 | buffer.length]),
      buffer
    ], buffer.length + 1)
  };
}

module.exports = {
  debugType,
  debugData,
  parseData,
  getLength,
  readLength,
  getBufferFromNumber,
  parseOID,
};
