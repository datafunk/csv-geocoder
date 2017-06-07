#!/usr/bin/env node

/*
    PSUI - Process Stdout User Interface
    for CSV-Geocoder
*/

const args = process.argv
const log = console.log
const chalk = require('chalk')
const fs = require('fs')
const pjson = require('./package.json')

var psui = {}
module.exports = psui

psui.parse = parse = function () {

    for (let i = 2; i < args.length; i++) {

        if (args[i] === '-h') {
            readHelpFile()
        }

        if (args[i] === '-i') {
            psui.input = args[i + 1]
        }

        if (args[i] === '-o') {
            psui.output = args[i + 1]
        }

        if (args[i] === '-p') {
            psui.provider = args[i + 1]
        }


    }
}

psui.psw = psw = function (_str) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    process.stdout.write(_str)
}

psui.readHelpFile = readHelpFile = function () {
    fs.readFile('./help.md', 'utf-8', function (err, data) {
        if (err) {
            psw('helpfile not found')
            process.exit(1)
        } else {
            log(pjson.name + ' v' + pjson.version + '\n')
            log(data)
        }
    })
}

psui.progress = progressPct = function (currentCount, maxCount) {

    pct = maxCount / 100
    currentPct = currentCount / pct

    var width = 50
    let ticks = Math.floor(currentPct * (width / 100))
    let diff = width - ticks

    psw('[' + '#'.repeat(ticks) + '-'.repeat(diff) + ']' + ' ' + currentPct.toFixed(1) + '%')
}

process.on('exit', function () {
    process.stdout.write('\n')
})
