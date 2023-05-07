const net = require('node:net');
const tls = require('node:tls');
const { Duplex } = require('node:stream');

const PacketParser = require('./clientHelloParser');

const createChannel = function () {
  let promiseResolve;
  let promise = new Promise((resolve) => {
    promiseResolve = resolve;
  });
  return {
    write: promiseResolve,
    read: () => {
      return promise;
    },
  };
};

const getTlsServerCallbackFunc = (onEvent) => {
  return async (socket) => {
    if (onEvent.data)
      socket.on('data', async (msg) => await onEvent.data(msg, socket));
    if (onEvent.end)
      socket.on('end', async (msg) => await onEvent.end(msg, socket));
    if (onEvent.error)
      socket.on('error', async (msg) => await onEvent.error(msg, socket));
  };
};

const getServerCallbackFunc = (tlsServer, onData) => {
  return (socket) => {
    const proxyStream = new Duplex({
      read(size) {},
      write(chunk, encoding, callback) {
        socket.write(chunk);
        callback();
      },
    });

    socket.on('data', (d) => {
      proxyStream.push(d);
    });

    proxyStream.on('data', (data) =>
      onData(data, {
        addr: socket.remoteAddress,
        fam: socket.remoteFamily,
        port: socket.remotePort,
      })
    );

    tlsServer.emit('connection', proxyStream);
  };
};

module.exports = (config) => {
  if (!config?.tls?.key) throw new Error('Requires a TLS key');
  if (!config?.tls?.cert) throw new Error('Requires a TLS cert');
  if (!config?.reqHandler) throw new Error('Requires a request handler');

  const TLSOnData = async (data, socket) => {
    const tls = await tlsChan.read();
    const response = await config.reqHandler(data, tls);
    socket.write(response);
  };

  const NETOnData = async (data, ip) => {
    const pkg = new PacketParser(data);
    pkg.ip = ip;
    if (pkg.isClientHello) tlsChan.write(pkg.out());
  };

  const tlsChan = createChannel();
  const tlsServer = tls.createServer(
    config.tls,
    getTlsServerCallbackFunc({
      data: TLSOnData,
    })
  );

  tlsServer.on('error', function (error) {
    console.error(error);
    tlsServer.destroy();
  });

  return net.createServer(getServerCallbackFunc(tlsServer, NETOnData));
};
