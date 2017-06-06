#!/usr/bin/env node

const psui = require('./psui')

let i = 0
setInterval(function () {
    // progressBar(i)
    psui.progress(i, 20)
    if (i < 20) {
        i++
    } else {
        process.exit()
    }
}, 500)
