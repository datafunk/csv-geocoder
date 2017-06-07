#!/usr/bin/env node

const args = process.argv
const log = console.log
const chalk = require('chalk')
const fs = require('fs')
// const env = args[0]
// const scr = args[1]
const pjson = require('./package.json')

var psui = {}
module.exports = psui

psui.parse = parse = function () {

    for (let i = 2; i < args.length; i++) {
        // log(args[i])

        if (args[i] === '-h') {
            readHelpFile()

        }

        if (args[i] === '-i') {
            psui.input = args[i + 1]
            // log('input file found: ', psui.input)
        }

        if (args[i] === '-o') {
            psui.output = args[i + 1]
            // log('output file found:', psui.output)
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

psui.progressBarDemo = progressBarDemo = function () {
    let i = 0
    setInterval(function () {
        // progressBar(i)
        progressbar(i, 20)
        if (i < 20) {
            i++
        } else {
            process.exit()
        }
    }, 400)
}


psui.progress = progressPct = function (currentCount, maxCount) {

    pct = maxCount / 100
    currentPct = currentCount / pct

    var width = 50
    let ticks = Math.floor(currentPct * (width / 100))
    let diff = width - ticks
    // console.log(' ', ticks, diff)
    psw('[' + '#'.repeat(ticks) + '_'.repeat(diff) + ']' + ' ' + currentPct.toFixed(1) + '%')

}

// print new line before exiting
process.on('exit', function () {
    process.stdout.write('\r')
})
