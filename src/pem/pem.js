const fs = require('fs');
const { Chunk } = require('../der/der.js');
const { splitString } = require('../common/utils.js');
const { TYPE } = require('./constants.js');

const PART_RE = /-----BEGIN ([\w ]+)-----\s*([\w\W]+?)\s*-----END ([\w ]+)-----/g;

function PEM (type, data) {
  this.type = type;
  this.data = data;
  this.params = {
    width: 64,
  };
}
PEM.prototype.toString = function () {
  return '-----BEGIN ' + this.type + '-----\n' +
    splitString(
      this.data.toString('base64'),
      this.params.width
    ).join('\n') +
    '\n-----END ' + this.type + '-----';
}
PEM.readFromFile = function (file) {
  return new Promise(function (resolve, reject) {
    fs.readFile(file, function (error, data) {
      if (error) {
        reject(error);
      } else {
        const result = PEM.parse(data);

        resolve(result);
      }
    });
  });
}
PEM.parse = function (data) {
  const content = data.toString();

  let partMatch = null;
  const result = [];
  PART_RE.lastIndex = 0;

  while (partMatch = PART_RE.exec(content)) {
    if (partMatch[1] !== partMatch[3]) {
      throw new Error('Header and footer mismatch. Header: ' + partMatch[1] + ', footer: ' + partMatch[3]);
    }

    const lnPosition = partMatch[2].indexOf('\n');
    const pem = new PEM(partMatch[1], Buffer.from(partMatch[2], 'base64'));

    if (lnPosition > -1) {
      pem.params.width = lnPosition;
    }

    result.push(pem);
  }

  return result;
}
PEM.TYPE = TYPE;

PEM.prototype.readDER = function () {
  return Chunk.read(this.data);
}

module.exports = { PEM };
