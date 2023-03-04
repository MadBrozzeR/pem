const { PEM } = require('../index.js');
const { Chunk } = require('../src/der/der.js');

module.exports = {
  'PEM data is correctly read': function (resolve) {
    const { checks } = this;
    const dataToParse = [
      '-----BEGIN CERTIFICATE REQUEST-----',
      'MIHHMHMCAQAwDjEMMAoGA1UEAwwDYXNkMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJB',
      'AK1RiSg7+E2s2tyCtj/63IXk9F8nT44+PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cc',
      'cA996OaW5xxDz2LeX2D6cokCAwEAAaAAMA0GCSqGSIb3DQEBCwUAA0EAMKHzrPNG',
      'tceXiSuFt4laz0nFvt8psAcjhL/Ke3Zf/xDvLIum1Li7Q26qoRAqst90+Ux+I61w',
      'VqrwHTo2lEzU+Q==',
      '-----END CERTIFICATE REQUEST-----',
      '',
      '-----BEGIN PUBLIC KEY-----',
      'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8n',
      'T44+PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokC',
      'AwEAAQ==',
      '-----END PUBLIC KEY-----'
    ].join('\n');

    const dataToCheck = [
      Buffer.from('MIHHMHMCAQAwDjEMMAoGA1UEAwwDYXNkMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8nT44+PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokCAwEAAaAAMA0GCSqGSIb3DQEBCwUAA0EAMKHzrPNGtceXiSuFt4laz0nFvt8psAcjhL/Ke3Zf/xDvLIum1Li7Q26qoRAqst90+Ux+I61wVqrwHTo2lEzU+Q==', 'base64'),
      Buffer.from('MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8nT44+PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokCAwEAAQ==', 'base64'),
    ];

    const pems = PEM.parse(dataToParse);

    if (pems.length !== 2) {
      throw 'Wrong PEM count';
    }

    if (pems[0].type !== 'CERTIFICATE REQUEST' || pems[1].type !== 'PUBLIC KEY') {
      throw 'Wrong PEM type detection';
    }

    if (!pems[0].data.equals(dataToCheck[0]) || !pems[1].data.equals(dataToCheck[1])) {
      throw 'Incorrect data parsing';
    }

    if (pems[0].params.width !== 64 || pems[1].params.width !== 60) {
      throw 'Incorrect width detection';
    }

    resolve();
  },

  'PEM is correctly serialized': function (resolve) {
    const data = Buffer.from('MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8nT44+PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokCAwEAAQ==', 'base64');
    const results = {
      public64: [
        '-----BEGIN PUBLIC KEY-----',
        'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8nT44+',
        'PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokCAwEAAQ==',
        '-----END PUBLIC KEY-----'
      ].join('\n'),
      public60: [
        '-----BEGIN PUBLIC KEY-----',
        'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8n',
        'T44+PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokC',
        'AwEAAQ==',
        '-----END PUBLIC KEY-----'
      ].join('\n'),
      certificate: [
        '-----BEGIN CERTIFICATE-----',
        'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8nT44+',
        'PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokCAwEAAQ==',
        '-----END CERTIFICATE-----'
      ].join('\n')
    }

    if (new PEM(PEM.TYPE.PUBLIC_KEY, data).toString() !== results.public64) {
      throw 'Serialization with default parameters failed';
    }

    const pem = new PEM(PEM.TYPE.PUBLIC_KEY, data);
    pem.params.width = 60;

    if (pem.toString() !== results.public60) {
      throw 'Serialization with custom width failed';
    }

    if (new PEM(PEM.TYPE.CERTIFICATE, data).toString() !== results.certificate) {
      throw 'Serialization with custom type (CERTIFICATE) failed';
    }

    resolve();
  },

  'PEM is correctly read from file': function (resolve, reject) {
    const result = [
      {
        type: 'PUBLIC KEY',
        data: Buffer.from('MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8nT44+PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokCAwEAAQ==', 'base64')
      },
      {
        type: 'CERTIFICATE REQUEST',
        data: Buffer.from('MIHHMHMCAQAwDjEMMAoGA1UEAwwDYXNkMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8nT44+PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokCAwEAAaAAMA0GCSqGSIb3DQEBCwUAA0EAMKHzrPNGtceXiSuFt4laz0nFvt8psAcjhL/Ke3Zf/xDvLIum1Li7Q26qoRAqst90+Ux+I61wVqrwHTo2lEzU+Q==', 'base64')
      }
    ];

    return PEM.readFromFile('./test.pem')
      .then(function (pems) {
        if (pems.length !== 2) {
          throw 'Wrong PEMs count';
        }

        if (pems[0].type !== result[0].type || pems[1].type !== result[1].type) {
          throw 'Wrong type detection';
        }

        if (!pems[0].data.equals(result[0].data) || !pems[1].data.equals(result[1].data)) {
          throw 'Data parsed incorrectly';
        }

        resolve();
      })
      .catch(function (error) {
        reject(error);
      });
  },

  'PEM throws error on type mismatch': function (resolve, reject) {
    const { throwsError } = this;
    const data = [
      '-----BEGIN PUBLIC KEY-----',
      'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8n',
      'T44+PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokC',
      'AwEAAQ==',
      '-----END PUBLICK KEY-----'
    ].join('\n');
    const errorText = 'Header and footer mismatch. Header: PUBLIC KEY, footer: PUBLICK KEY';

    return throwsError(PEM.parse.bind(PEM, data), 'Error is not thrown')
      .then(function (error) {
        if (error.message !== errorText) {
          reject('Wrong error message');
        }
      })
      .then(resolve)
      .catch(reject);
  },

  'PEM is read as DER': function (resolve) {
    const { instanceOf, equals } = this;

    const data = [
      '-----BEGIN PUBLIC KEY-----',
      'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8nT44+',
      'PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokCAwEAAQ==',
      '-----END PUBLIC KEY-----'
    ].join('\n');
    const pems = PEM.parse(data);
    const der = pems[0].readDER();

    instanceOf(der, Chunk, 'DER Chunk was not created');
    equals(der.raw.toString('hex'), pems[0].data.toString('hex'), 'DER raw format doesn\'t match PEM data');

    resolve();
  }
}
