const querystring = require('node:querystring');
const parseHttpData = require('./httpParser');

const cookieParser = (cookieString) => {
  if (!cookieString || typeof cookieString !== 'string') return {};
  let pairs = cookieString.split(';');
  let splittedPairs = pairs.map((cookie) => cookie.split('='));
  const cookieObj = splittedPairs.reduce(function (obj, cookie) {
    obj[decodeURIComponent(cookie[0].trim())] = decodeURIComponent(
      cookie[1].trim()
    );
    return obj;
  }, {});
  return cookieObj;
};

module.exports = class Request {
  constructor(data, tls) {
    const req = parseHttpData(data);
    this.ip = tls.ip;
    this.method = req.method;
    this.path = req.path;
    this.headers = req.headers;
    this.body = req.body.toString();
    this.tls = tls;
    this.ended = false;
    this.cookies = cookieParser(this.headers.cookie);

    if (this.headers['content-type'] === 'application/x-www-form-urlencoded')
      this.body = querystring.parse(this.body);
  }

  json() {
    return JSON.parse(this.body);
  }

  end() {
    this.ended = true;
  }
};
