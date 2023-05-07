const ChallengerPassive = require('./challenger/custom_server');
const ChallengerActive = require('./challenger');
const challenges = require('./exampleChallenges');

const app = new ChallengerPassive({
  tls: {
    key: ChallengerPassive.loadFile('./example_cert/key.pem'),
    cert: ChallengerPassive.loadFile('./example_cert/cert.pem'),
  },
});

const host = 'localhost';
const port = 8443;

const challenger = new ChallengerActive();
challenger.setupApp(app);
challenges(challenger);

app.get('/', async (req, res) => {
  console.log('New request: /');
  res.send(`You are verified! Your JA3 is: ${req.tls.ja3Hash}`);
});

app.get('/submit', async (req, res) => {
  res.redirect('/');
});

app.start(host, port, (e) =>
  console.log(`Server listening on https://${host}:${port}`)
);
