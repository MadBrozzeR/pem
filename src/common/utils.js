function splitString (string, width) {
  if (string.length <= width) {
    return [string];
  }

  let last = 0;
  let result = [];

  for (let index = width ; index < string.length ; index += width) {
    result.push(string.substring(last, index));
    last = index;
  }
  result.push(string.substring(last));

  return result;
}

function HEX (buffer, { length, width = 16 } = {}) {
  let result = buffer.toString('hex');

  if (length && length < buffer.length) {
    result = result.substring(0, length * 2) + '...';
  }

  if (width) {
    result = splitString(result, width * 2).join('\n');
  }

  result = result.replace(/([\w\d]{2})(?!\n|$)/g, '$1 ');

  return result;
}

function keyValueSwap (object) {
  const result = {};

  for (const key in object) {
    result[object[key]] = key;
  }

  return result;
}

module.exports = { splitString, keyValueSwap, HEX };
