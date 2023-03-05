const { HEX } = require("../common/utils.js");
const { OID } = require('../oid/oid.js');
const { TYPES, TYPE_CONST } = require('./constants.js');
const { Stack } = require('../common/stack.js');

// DEPRECATED
/*
function debugType (chunk) {
  return '[' +
    chunk.typeByte.toString(16) +
    '] ' +
    TYPE_CONST[chunk.type];
}
*/

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

  const info = chunk.getInfo();

  if (data instanceof Buffer) {
    return info.length
      ? spacer + HEX(info.data, { length: 32, width: 0 }) + '\n'
      : '';
  }

  if (data instanceof OID) {
    return spacer + HEX(info.data, { length: 32, width: 0}) +
      ' (' + data.toString() + ')\n';
  }

  return spacer + HEX(info.data, { length: 32, width: 0 }) +
    ' (' + data + ')\n';
}

function readOID (buffer) {
  let result = '';

  const first = buffer.readUInt8(0);
  result += Math.floor(first / 40);
  result += '.' + first % 40;
  let big = 0;

  for (let index = 1 ; index < buffer.length ; ++index) {
    const byte = buffer.readUInt8(index);

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
      const stack = new Stack();
      let value;

      while (current > 0) {
        value = current & 0x7f;

        if (stack.top !== Stack.Null) {
          value = value | 0x80;
        }

        stack.push(value);
        current = current >> 7;
      }

      while ((value = stack.pop()) !== Stack.Null) {
        bytes.push(value);
      }
    }
  }

  return Buffer.from(bytes);
}

function readChunkInfo (buffer, index = 0) {
  const result = {
    type: buffer[index + 0],
    length: buffer[index + 1],
    header: 2,
    total: 2,
    data: null,
  };

  if (result.length & 0x80) {
    const extraBytes = result.length & 0x7f;

    if (extraBytes > 6) {
      throw new Error('Data length > 6 bytes is not supported yet. Given length is ' + extraBytes);
    }

    result.length = buffer.readUIntBE(index + 2, extraBytes);
    result.header += extraBytes;
  }

  result.total = result.header + result.length;
  result.data = buffer.slice(index + result.header, index + result.total);

  return result;
}

function getBufferFromNumber (number, { ignoreLeadingZero = false } = {}) {
  const isNegative = number < 0;
  const buffer = Buffer.alloc(7);
  buffer.writeUIntBE(Math.abs(number), 1, 6);

  if (isNegative) {
    throw new Error('Negative numbers are not supported yet');
  }

  if (number === 0) {
    return Buffer.alloc(1);
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

function getDataLength (data) {
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
  // debugType,
  debugData,
  getDataLength,
  readChunkInfo,
  getBufferFromNumber,
  parseOID,
  readOID,
};
