# Challenger - Browser fingerprinting and antibot framework

Challenger is a custom express-inspired webserver that you can use to protect your site against bad bots and browser automation.
It is not a replacement for a real antibot vendor, and you should look at it like a PoC.

It can let the client solve challenges and fingerprint the TLS client hello that the client sends.

It has 0 dependencies!

## Demo

```sh
$ npm run demo
```

## Usage

```js
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

// Register a challenge
// This will flag puppeteer extra
// https://github.com/berstend/puppeteer-extra/issues/407
Challenger.registerChallenge({
  // The weight of the challenge, basically how important it is it be correct
  weight: 10,

  // the code that will be executed on the clientside
  exec: `navigator.plugins.item(4294967296) === navigator.plugins[0]`,

  // this is the expected result. You can do complex stuff here!
  verifier: (res) => res === true,
});

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
```
