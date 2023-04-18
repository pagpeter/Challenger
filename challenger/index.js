const crypto = require('node:crypto');
const fs = require('node:fs');

const express = require('express');
const cookieParser = require('cookie-parser');

const uuid = () => {
    return crypto.randomUUID();
};

const challengePage = fs.readFileSync('./challenger/challenge.html', 'utf-8');

module.exports = class Challenger {
    constructor() {
        this.challenges = [];
        this.config = {
            randomizeOrder: true,
            includeNumber: -1,
            whitelistedIps: [],
            headerName: `x-challenger-id`,
            neededTrust: 0.9,
        };
        this.challengeClients = [];
        this.verifiedHeaders = {};
    }

    setupApp(app) {
        app.use(cookieParser());
        app.use(
            express.urlencoded({
                extended: true,
            })
        );
        app.use(this.middleware());
    }

    debug(...args) {
        console.log('[Challenger]', ...args);
    }

    challengePage(id) {
        const challenge = this.makeChallenge();
        return challengePage
            .replaceAll('{{challengeId}}', id)
            .replaceAll('/*challenges*/', challenge);
    }

    verifyChallengeData(chlData, chlId) {
        this.debug(`Verifying request data of ${chlId}`);
        const data = JSON.parse(Buffer.from(chlData, 'base64').toString('utf-8'));
        let trustScore = 0;
        let maxTrustScore = 0;
        this.challenges.forEach((chl, i) => {
            const valid = chl.verifier(data[i]);
            if (valid) trustScore += chl.weight;
            else this.debug(chl.exec, data[i])
            maxTrustScore += chl.weight;
        });
        const trust = trustScore / maxTrustScore;
        this.debug(`TRUST: ${trustScore}/${maxTrustScore} (${trust * 100}%)`);
        return trust >= this.config.neededTrust;
    }

    makeChallenge() {
        let chl = ``;
        this.challenges.forEach(
            (c, i) => {
                (chl += `try {results[${i}] = ${c.exec}}catch(e){results[${i}]=e};`)
            }
        );
        return chl;
    }

    handleRequest(req, res, next, reqData) {
        if (!reqData.id) {
            this.debug('No challenge header - serving new challenge');
            const chlId = uuid();
            this.challengeClients.push({
                id: chlId,
                location: reqData.path,
                ip: reqData.ip,
            });
            res.send(this.challengePage(chlId));
            res.end();
            return;
        }

        const challengeData = this.challengeClients.find(
            (chl) => chl.id === reqData.id
        );
        if (!challengeData) {
            this.debug('Challenge doesnt exist - serving new challenge');
            res.clearCookie(this.config.headerName);
            return this.handleRequest(req, res, next, {
                ...reqData,
                id: null,
            });
        } else if (challengeData.solved) {
            this.debug('Challenge exists and already solved');
            if (challengeData.ip === reqData.ip) return next();
            else {
                this.debug("IP doesn't match!");
                this.challengeClients = this.challengeClients.filter(
                    (chl) => chl.id !== challengeData.id
                );
                return this.handleRequest(req, res, next, {
                    ...reqData,
                    id: null,
                });
            }
        } else if (!challengeData.solved) {
            this.debug('Challenge exists, but not solved - serving new challenge');
            res.clearCookie(this.config.headerName);
            return next();
        } else {
            this.debug('Something weird happened');
            res.clearCookie(this.config.headerName);
            return next();
        }
    }

    handleSubmit(req, res, next, reqData) {
        const chlId = req.body['challenge-id'];
        this.debug(`Handling submit! ID: ${chlId}`);

        const challengeData = this.challengeClients.find((chl) => chl.id === chlId);
        if (!challengeData) {
            this.debug("Invalid ID! Doesn't exist.");
            res.clearCookie(this.config.headerName);
            this.handleRequest(req, res, next, {
                ...reqData,
                id: null,
            });
        }

        const validResult = this.verifyChallengeData(
            req.body['challenge-result'],
            chlId
        );
        if (!validResult) {
            this.debug('Invalid result!');
            try {
                res.clearCookie(this.config.headerName)
                res.send("Invalid result")
                res.end()
            } catch {}

            return next()
        }

        this.challengeClients = this.challengeClients.filter(
            (chl) => chl.id !== chlId
        );
        this.verifiedHeaders[chlId] = true;
        res.cookie(this.config.headerName, chlId);
        res.redirect(challengeData.location);

    }

    middleware() {
        return (req, res, next) => {
            const reqData = {
                ip: req.ip,
                path: req.path,
                id: req.cookies[this.config.headerName],
            };
            this.debug(
                `Incoming request (${reqData.path}). IP: ${reqData.ip}, chl-id: ${
          reqData.id || '-'
        }`
            );

            if (this.config.whitelistedIps.includes(reqData.ip)) {
                this.debug('IP is whitelisted');
                return next();
            }

            if (this.verifiedHeaders[reqData.id]) return next();

            if (reqData.path === '/submit' && req.method === 'POST')
                return this.handleSubmit(req, res, next, reqData);
            return this.handleRequest(req, res, next, reqData);
        };
    }
    registerChallenge(chl) {
        if (!chl.weight) chl.weight = 1;
        if (typeof chl.exec !== 'string' || !chl.exec.length)
            throw new Error(`Invalid exec field: ${chl.exec}`);
        if (typeof chl.verifier !== 'function')
            throw new Error(`Invalid verifier: ${chl.verifier}`);
        this.challenges.push(chl);
    }
};