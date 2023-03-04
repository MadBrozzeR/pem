const { OIDLib } = require('./constants.js');

function OID (id) {
  this.id = id;
}
OID.prototype.get = function () {
  return OIDLib[this.id];
}
OID.prototype.toString = function () {
  const value = this.get();

  return this.id + (value ? (' [' + value + ']') : '');
}
OID.LIB = OIDLib;

module.exports = { OID };
