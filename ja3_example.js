const challenger = require('./challenger/custom_server');

const server = new challenger({
  tls: {
    key: challenger.loadFile('./example_cert/key.pem'),
    cert: challenger.loadFile('./example_cert/cert.pem'),
  },
});

const host = 'localhost';
const port = 8443;

server.get('/', async (req, res) => {
  console.log('New request: /');
  console.log(req, res);
  res.send('Hello, World!');
});

server.start(host, port, (e) =>
  console.log(`Server listening on https://${host}:${port}`)
);
