#!/usr/bin/env node

const psui = require('./psui')

let i = 0
let c = 13
setInterval(function () {
    // progressBar(i)
    psui.progress(i, c)
    if (i < c) {
        i++
    } else {
        process.exit()
    }
}, 500)
