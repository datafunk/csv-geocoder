#!/usr/bin/env node

const args = process.argv
const log = console.log
const chalk = require('chalk')
const fs = require('fs')
// const env = args[0]
// const scr = args[1]

var psui = {}
module.exports = psui

psui.psw = psw = function (_str) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    process.stdout.write(_str)
}

psui.readHelpFile = readHelpFile = function () {
    fs.readFile('./help.md', 'utf-8', function (err, data) {
        if (err) {
            psw(chalk.red('helpfile not found'))
            process.exit(1)
        } else {
            log(chalk.black.bgWhite(pjson.name + ' v' + pjson.version + '\n'))
            log(chalk.yellow(data))
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
    var pct_1 = width / 100

    // let pct_c = Math.floor(currentPct)
    let ticks = Math.round(currentPct) * (width / 100)
    let diff = width - ticks

    // psw(currentPct + '%')

    // var bar = '[' + ' '.repeat(width) + ']' // 2% = 1 tick
    // marks = '#'.repeat(ticks)
    // log(marks)
    // bar = bar.replace(/[#\s]{tick}/, '#')
    var bar = '[' + '#'.repeat(ticks) + ' '.repeat(diff) + ']'

    psw(bar + ' ' + currentPct + '%')

}

for (let i = 2; i < args.length; i++) {
    // log(args[i])

    if (args[i] === '-i') {
        psui.input = args[i + 1]
        log('input file found: ', psui.input)
    }

    if (args[i] === '-o') {
        psui.output = args[i + 1]
        log('output file found:', psui.output)
    }

    if (args[i] === '-h') {
        readHelpFile()
    }
}

// print new line before exiting
process.on('exit', function () {
    process.stdout.write('\n')
})