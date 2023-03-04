const PEM = require('./pem.js');
const DER = require('./der.js');
const writeDER = require('./write-der.js');

function logExpectations (message, expected, received) {
  return message + '\n  EXPECTED:\n    ' + expected + '\n  RECEIVED:\n    ' + received;
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
function testAll() {
  let tests = Promise.resolve();
  let success = true;

  for (let index = 0 ; index < arguments.length ; ++index) {
    const test = arguments[index];

    for (const description in test) {
      tests = tests.then(function () {
        out(description + ': ');

        return new Promise(test[description].bind(testSuit))
          .then(function () {
            out('DONE\n');
          })
          .catch(function (error) {
            out('FAILED\n');
            out('REASON: ' + (error instanceof Error ? error.message : error) + '\n');
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
      out('All tests successfully passed\n');
    } else {
      out('Some test failed\n')
    }
  });
}

testAll(PEM, DER, writeDER);
