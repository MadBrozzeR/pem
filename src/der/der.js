const { Reader } = require('mbr-buffer');
const { HEX } = require('../common/utils.js');
const { TYPE_CONST } = require('./constants.js');
const { debugType, debugData, parseData, readLength } = require('./utils.js');

function Chunk (reader, parent = null) {
  const start = reader.index;
  const typeByte = reader.readUIntBE(1);
  const length = readLength(reader);
  const end = reader.index + length.value;

  this.typeByte = typeByte;
  this.length = length;
  this.type = typeByte & 0b00111111;
  this.typeClass = typeByte & 0b11000000;
  this.rawData = length.value ? reader.slice(length.value) : Buffer.alloc(0);
  this.raw = reader.buffer.slice(start, end);
  this.parent = parent;

  this.data = parseData(this);
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
  return HEX(this.raw, params);
}
Chunk.prototype.debug = function (spacer = '') {
  return spacer + HEX(Buffer.from([this.typeByte])) +
    ' ' + HEX(this.length.raw) +
    ' (' + (TYPE_CONST[this.type] || '[???]') +
    ': ' + this.length.value + ')\n' +
    debugData(this.data, this, spacer + '  ');
}
Chunk.prototype.readAsChunk = function () {
  return Chunk.read(this.data);
}
Chunk.read = function (buffer) {
  return new Chunk(new Reader(buffer));
}

module.exports = { Chunk };
