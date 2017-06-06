#!/usr/bin/env node

var args = process.argv
var log = console.log

function plog(_str) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    _str = _str.toString()
    process.stdout.write(_str)
}

function progressBar(num) {
    plog('.'.repeat(num))

}

let i = 0
setInterval(function () {
    progressBar(i)
    if (i < 20) {
        i++
    } else {
        process.exit()
    }
}, 400)

const env = args[0]
const scr = args[1]

var in_file = '',
    out_file = ''

for (let i = 2; i < args.length; i++) {
    // log(args[i])

    if (args[i] === '-i') {
        in_file = args[i + 1]
        log('input file found: ', in_file)
    }

    if (args[i] === '-o') {
        log('output file found')
        out_file = args[i + 1]
    }

    if (args[i] === '-h') {
        log('Time to write some helpful info')
        log('like this')
        log('like this')
        log('like this')
        log('like this')
        log('and this')
    }
}


// print new line before exiting
process.on('exit', function () {
    process.stdout.write('\n')
})
