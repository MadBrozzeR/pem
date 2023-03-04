const { keyValueSwap } = require('../common/utils.js');

const TYPES = {
  INTEGER: 0x02,
  BIT: 0x03,
  OCTET: 0x04,
  NULL: 0x05,
  OBJECT: 0x06,
  UTF8: 0x0c,
  SEQUENCE: 0x30,
  SET: 0x31,
  PRINTABLE: 0x13,
  T61: 0x14,
  IA5: 0x16,
  TIME: 0x17,
};
const TYPE_CONST = keyValueSwap(TYPES);

module.exports = { TYPES, TYPE_CONST };
