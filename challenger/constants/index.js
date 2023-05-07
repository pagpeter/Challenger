const { readFileSync } = require('node:fs');

module.exports = {
  CIPHERS: require('./ciphers.js'),
  EXTENSIONS: require('./extensions.js'),
  CHALLENGE: readFileSync('./challenger/constants/challenge.html', 'utf-8'),
  HTTP_CODES: require('./http_codes.js'),
  GREASE: [
    0x0a0a, 0x0a0a, 0x1a1a, 0x2a2a, 0x3a3a, 0x4a4a, 0x5a5a, 0x6a6a, 0x7a7a,
    0x8a8a, 0x9a9a, 0xaaaa, 0xbaba, 0xcaca, 0xdada, 0xeaea, 0xfafa, 0xa0a,
  ],
};
