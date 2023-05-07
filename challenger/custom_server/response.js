const { HTTP_CODES } = require('../constants');

module.exports = class Response {
  constructor() {
    this.body = '';
    this.contentType = 'text/html, text, plain';
    this.ended = false;
    this.redirected = false;
    this.statusCode = 200;
    this.cookies = {};
    this.headers = {};
  }

  send(text) {
    this.body = text;
  }

  end() {
    this.ended = true;
  }

  clearCookie() {
    this.cookies = {};
  }

  cookie(k, v) {
    this.cookies[k] = v;
  }

  setContentType(ct) {
    this.contentType = ct;
  }

  setStatus(status) {
    this.statusCode = status;
  }

  redirect(path) {
    this.redirected = path;
  }

  header(k, v) {
    this.headers[k] = v;
  }

  marshalResponse() {
    if (this.redirected) {
      this.statusCode = 302;
      this.header('Location', this.redirected);
    }

    this.header('Content-Type', this.contentType);
    this.header('Content-Length', this.body.length);

    let headers = [];
    Object.entries(this.headers).forEach(([k, v]) => {
      headers.push(`${k}: ${v}`);
    });

    Object.entries(this.cookies).forEach(([k, v]) => {
      headers.push(`Set-Cookie: ${k}=${v}`);
    });

    const resMessage = HTTP_CODES[this.statusCode || 200] || 'OK';
    return `HTTP/1.1 ${this.statusCode} ${resMessage}\r\n${headers.join(
      '\r\n'
    )}\r\n\r\n${this.body}`;
  }
};
