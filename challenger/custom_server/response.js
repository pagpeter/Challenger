const { HTTP_CODES } = require('../constants');

module.exports = class Response {
  constructor() {}

  send(text) {
    this.body = text;
  }

  setContentType(ct) {
    this.contentType = ct;
  }

  setStatus(status) {
    this.statusCode = status;
  }

  marshalResponse() {
    const resMessage = HTTP_CODES[this.statusCode || 200] || 'OK';

    return `HTTP/1.1 ${this.statusCode} ${resMessage}
Server: Challenger
Content-type: ${this.contentType || 'text/html, text, plain'}
Content-length: ${this.body.length}

${this.body}`;
  }
};
