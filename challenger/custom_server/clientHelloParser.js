const { CIPHERS, EXTENSIONS, GREASE } = require('../constants');
const crypto = require('node:crypto');

const md5 = (data) => crypto.createHash('md5').update(data).digest('hex');

const fromBytes = (...bytes) => {
  const buf = Buffer.from([...bytes]);
  return parseInt(buf.toString('hex'), 16);
};

module.exports = class PacketParser {
  constructor(buf) {
    this.buf = buf;
    this.p = {
      length: null,
      version: null,
      clientRandom: null,
      sessionId: null,
      sessionIdLength: 0,
      cipherSuites: [],
      cipherSuitesLength: 0,
      compressionMethodsLength: 0,
      compressionMethods: [],
      extensions: [],
      parsedExtensions: [],
      extensionsLength: 0,
      ja3: null,
    };

    this.c = 0; // cursor

    const isHandshake = this.readOne() === 0x16;
    if (!isHandshake) return;

    this.parseAll();
    this.calculateJa3();
  }

  calculateJa3() {
    let ja3Vals = [];

    ja3Vals.push(this.p.outerTlsVersion);
    ja3Vals.push(this.p.cipherSuites.join('-'));
    ja3Vals.push(this.p.extensions.map((e) => e.type).join('-'));
    ja3Vals.push('0');
    ja3Vals.push('0');

    this.p.ja3 = ja3Vals.join(',');
  }

  readOne() {
    return this.buf[this.c++];
  }

  IntFromNBytes(n) {
    let bytes = [];
    for (let i = 0; i < n; i++) {
      bytes.push(this.readOne());
    }
    return fromBytes(...bytes);
  }

  StringFromNBytes(n) {
    let bytes = [];
    for (let i = 0; i < n; i++) {
      bytes.push(this.readOne());
    }
    const buf = Buffer.from(bytes);
    return buf.toString('hex');
  }

  getCipherName(c) {
    if (GREASE.includes(c)) {
      return `TLS_GREASE (${c})`;
    }
    if (CIPHERS[c]) return `${CIPHERS[c]} (${c})`;
    return `UNKNOWN CIPHER (${c})`;
  }

  getExtensionName(e) {
    if (GREASE.includes(e)) {
      return `TLS_GREASE (${e})`;
    }
    if (EXTENSIONS[e]) return `${EXTENSIONS[e]} (${e})`;
    return `UNKNOWN EXTENSION (${e})`;
  }

  parseAll() {
    // TLS Version (outer, unused)
    this.p.outerTlsVersion = fromBytes(this.readOne(), this.readOne());

    // Total length (not needed)
    this.p.totalLength = fromBytes(this.readOne(), this.readOne());

    // Handshake type
    this.isClientHello = this.readOne() === 0x01;
    if (!this.isClientHello) return;
    this.p.length = this.IntFromNBytes(3);
    this.p.version = this.IntFromNBytes(2);
    this.p.clientRandom = this.StringFromNBytes(32);
    this.p.sessionIdLength = this.IntFromNBytes(1);

    // parse sessionId
    if (this.p.sessionIdLength)
      this.p.sessionId = this.StringFromNBytes(this.p.sessionIdLength);

    // parse cipher suites
    this.p.cipherSuitesLength = this.IntFromNBytes(2);
    for (let i = 0; i < this.p.cipherSuitesLength; i += 2)
      this.p.cipherSuites.push(this.IntFromNBytes(2));

    this.p.compressionMethodsLength = this.IntFromNBytes(1);
    for (let i = 0; i < this.p.compressionMethodsLength; i++)
      this.p.compressionMethods.push(this.IntFromNBytes(1));

    this.p.extensionsLength = this.IntFromNBytes(2);
    this.parseExtensions();
    this.parseExtensionsMore();
  }

  parseExtensions() {
    const end = this.c + this.p.extensionsLength;
    while (end > this.c) {
      const ext = {};
      ext.type = this.IntFromNBytes(2);
      ext.len = this.IntFromNBytes(2);
      ext.data = [];
      for (let i = 0; i < ext.len; i++) ext.data.push(this.readOne());
      this.p.extensions.push(ext);
    }
  }

  parseExtensionsMore() {
    this.p.extensions.forEach((ext) => {
      const next = { name: this.getExtensionName(ext.type) };
      // switch (ext.type) {
      //   case 10:
      //     //   ext.type = 'supported_groups (10)';
      //     break;
      //   case 11:
      //     //   ext.type = 'ec_point_formats (11)';
      //     break;
      //   case 13:
      //     //   ext.type = 'signature_algorithms (13)';
      //     break;
      //   case 16:
      //     //   ext.type = 'application_layer_protocol_negotiation (16)';
      //     break;
      //   default:
      //     //   ext.type = `Unknown (${ext.type})`;
      //     break;
      // }
      this.p.parsedExtensions.push(next);
    });
  }

  out() {
    return {
      version: this.p.version,
      random: this.p.clientRandom,
      sessionId: this.p.sessionId || '',
      cipherSuites: this.p.cipherSuites.map((c) => this.getCipherName(c)),
      compression: this.p.compressionMethods,
      extensions: this.p.parsedExtensions,
      ja3: this.p.ja3,
      ja3Hash: md5(this.p.ja3),
      ip: `${this.ip?.addr}:${this.ip?.port}`,
    };
  }
};
