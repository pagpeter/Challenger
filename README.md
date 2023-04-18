# Challenger - Browser fingerprinting and antibot framework

Challenger is a simple express middleware that you can use to protect your site against bad bots and browser automation.
It is not a replacement for a real antibot vendor, and you should look at it like a PoC.

## Usage

```js
const express = require('express')
const challenger = require("./challenger")

const port = 3000
const app = express()

// Set up the Challenger middleware
const Challenger = new challenger()
Challenger.setupApp(app)

// Register a challenge
// This will flag puppeteer extra
// https://github.com/berstend/puppeteer-extra/issues/407
Challenger.registerChallenge({
    // The weight of the challenge, basically how important it is it be correct
    weight: 10,

    // the code that will be executed on the clientside
    exec: `navigator.plugins.item(4294967296) === navigator.plugins[0]`, 

    // this is the expected result. You can do complex stuff here!
    verifier: (res) => res === true 
})

// Your typical express stuff 
app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}`))