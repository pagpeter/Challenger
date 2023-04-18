module.exports = (C) => {
    const resultIs = (expected) => (res) => res === expected

    C.registerChallenge({
        weight: 10,
        exec: `(() => {return !!window.emit})()`,
        verifier: resultIs(false)
    })
    C.registerChallenge({
        weight: 10,
        exec: `(() => {return !!window.__nightmare})()`,
        verifier: resultIs(false)
    })
    C.registerChallenge({
        weight: 10,
        exec: `navigator.plugins.item(4294967296) === navigator.plugins[0]`,
        verifier: resultIs(true)
    })
    C.registerChallenge({
        weight: 10,
        exec: `navigator.webdriver`,
        verifier: resultIs(false)
    })
    C.registerChallenge({
        weight: 10,
        exec: `navigator.geolocation+""`,
        verifier: resultIs("[object Geolocation]")
    })
    C.registerChallenge({
        weight: 15,
        exec: `"cookieEnabled" in navigator && true === navigator.cookieEnabled`,
        verifier: resultIs(true)
    })
    // not supported widely enough
    // C.registerChallenge({
    //     weight: 15,
    //     exec: `(await navigator.userAgentData.getHighEntropyValues(["platform"])).platform`,
    //     verifier: (res) => {
    //         return true
    //     }
    // }) 
    C.registerChallenge({
        weight: 10,
        exec: `navigator.plugins.length`,
        verifier: (res) => res > 1
    })
}