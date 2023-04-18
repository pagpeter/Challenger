const express = require('express')
const challenger = require("./challenger")
const challenges = require("./exampleChallenges")

const app = express()
const port = 3000
const Challenger = new challenger()

Challenger.setupApp(app)
challenges(Challenger)

// Your typical express stuff 
app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}`))