const PEM = require('./pem.js');
const DER = require('./der.js');
const writeDER = require('./write-der.js');

function setColor (color) {
  return function (data) {
    return '\033[' + color + 'm' + data + '\033[0m'
  }
}

const COLOR = {
  RED: setColor(31),
  GREEN: setColor(32),
  YELLOW: setColor(33),
  BLUE: setColor('34;1'),
}

function logExpectations (message, expected, received) {
  return message + '\n    EXPECTED:\n      ' + COLOR.GREEN(expected) + '\n    RECEIVED:\n      ' + COLOR.RED(received);
}

const testSuit = {
  equals: function (received, expected, message) {
    if (expected !== received) {
      throw logExpectations(message, expected, received);
    }
  },
  instanceOf: function (received, expected, message) {
    if (received.constructor.name !== expected.name) {
      throw logExpectations(message, expected.name, received.constructor.name);
    }
  },
  checks: function (resolve, reject, cases) {
    let promise = Promise.resolve();

    for (const message in cases) {
      promise = promise.then(function () {
        const result = cases[message]();

        if (result) {
          throw result;
        }
      });
    }

    return promise.then(resolve).catch(reject);
  },
  throwsError: function (procedure, message = '') {
    return new Promise(function (resolve, reject) {
      if (procedure instanceof Promise) {
        procedure
          .then(function () {
            reject(message);
          })
          .catch(resolve);
      } else if (procedure instanceof Function) {
        try {
          procedure();
        } catch (error) {
          resolve(error);
        }

        reject(message);
      }
    });
  }
};

function out(data) {
  process.stdout.write(data);
}
function testAll(groups) {
  let tests = Promise.resolve();
  let success = true;

  for (const group in groups) {
    const test = groups[group];
    tests.then(function () {
      out(COLOR.BLUE(group) + (test.skip ? COLOR.YELLOW(' [SKIPPED]') : '') + '\n');
    });

    if (!test.skip) for (const description in test) {
      if (description === 'skip') {
        continue;
      }

      tests = tests.then(function () {
        out('  ' + description + ': ');

        return new Promise(test[description].bind(testSuit))
          .then(function () {
            out(COLOR.GREEN('DONE\n'));
          })
          .catch(function (error) {
            out(COLOR.RED('FAILED\n'));
            out('  REASON: ' + (error instanceof Error ? error.message : error) + '\n');
            success = false;

            if (error instanceof Error) {
              console.log(error);
            }
          });
      });
    }
  }

  tests.then(function () {
    if (success) {
      out(COLOR.GREEN('All tests successfully passed\n'));
    } else {
      out(COLOR.RED('Some test failed\n'));
    }
  });
}

testAll({ 'PEM Module': PEM, 'DER Parser': DER, 'DER Generator': writeDER });
