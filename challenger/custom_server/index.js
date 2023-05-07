const createServer = require('./createServer');
const Response = require('./response');
const Request = require('./request');
const fs = require('node:fs');

module.exports = class Server {
  static loadFile(path) {
    return fs.readFileSync(path, 'utf-8');
  }

  constructor(config) {
    config.reqHandler = async (...args) => await this.requestHandler(...args);
    this.server = createServer(config);
    this.routes = {};
    this.middlewares = [];
    this.notfound((req, res) => {
      res.send(`Path ${req.path} doesn't exist!`);
    });
  }

  start(host, port, cb) {
    this.server.listen(port, host, (e) => cb(e));
  }

  async requestHandler(data, tls) {
    const req = new Request(data, tls);
    const res = new Response();

    for (const middleware of this.middlewares) {
      let willContinue = false;
      const next = () => (willContinue = true);
      await middleware(req, res, next);
      if (res.redirected) return res.marshalResponse();
      if (!willContinue) return res.marshalResponse();
      if (res.ended || req.ended) return res.marshalResponse();
    }

    if (this.routes[`${req.method.toUpperCase()}_${req.path}`])
      await this.routes[`${req.method}_${req.path}`](req, res);
    else await this.routes.notfound(req, res);

    return res.marshalResponse();
  }

  use(cb) {
    this.middlewares.push(cb);
  }

  get(path, cb) {
    this.routes[`GET_${path}`] = cb;
  }

  post(path, cb) {
    this.routes[`POST_${path}`] = cb;
  }

  delete(path, cb) {
    this.routes[`DELETE_${path}`] = cb;
  }

  patch(path, cb) {
    this.routes[`PATCH_${path}`] = cb;
  }

  options(path, cb) {
    this.routes[`OPTIONS_${path}`] = cb;
  }

  put(path, cb) {
    this.routes[`PUT_${path}`] = cb;
  }

  notfound(cb) {
    this.routes.notfound = cb;
  }
};
