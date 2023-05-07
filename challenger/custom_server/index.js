const createServer = require('./createServer');
const Response = require('./response');
const parseHttpData = require('./httpParser');
const fs = require('node:fs');

module.exports = class Server {
  static loadFile(path) {
    return fs.readFileSync(path, 'utf-8');
  }

  constructor(config) {
    config.reqHandler = async (...args) => await this.requestHandler(...args);
    this.server = createServer(config);
    this.routes = {};
    this.notfound((req, res) => {
      res.send(`Path ${req.path} doesn't exist!`);
    });
  }

  start(host, port, cb) {
    this.server.listen(port, host, (e) => cb(e));
  }

  async requestHandler(data, tls) {
    const req = parseHttpData(data);
    req.tls = tls;
    const { method, path } = req;

    const res = new Response();

    if (this.routes[`${method.toUpperCase()}_${path}`])
      await this.routes[`${method}_${path}`](req, res);
    else await this.routes.notfound(req, res);

    return res.marshalResponse();
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
