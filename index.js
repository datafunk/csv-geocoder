#!/usr/bin/env node

require('dotenv').config()

const pjson = require('./package.json')
const psui = require('./psui')
const psw = psui.psw

const http = require('http')
const https = require('https')
const fs = require('fs')
const dsv = require('d3-dsv')

const log = console.log

var appName = pjson.name,
    appVersion = pjson.version

module.exports = geocoder

var geocoder = (function () {

    var is_address = ['ad', 'add', 'addr', 'address']
    var header_columns = []
    var address_column = undefined
    var sr = 0 // source rows count >> r
    var pr = 0 // processed rows count >> k
    var err_count = 0
    var parse_errors = []
    var gcode_errors = []
    var in_file = psui.input || process.argv[2]
    var out_file = psui.output || process.argv[3]
    var latLng = ''
    var frequency = process.env.REQ_FREQUENCY || 1200
    var previousRequestComplete = false

    var csv = []

    // UTILS

    function keysToLowerCase(obj) {
        Object.keys(obj).forEach(function (key) {
            var k = key.toLowerCase();

            if (k !== key) {
                obj[k] = obj[key];
                delete obj[key];
            }
        });
        return (obj);
    }

    // END UTILS

    if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_BASE_URI || !process.env.REQ_FREQUENCY) {
        if (!process.env.GOOGLE_API_KEY) {
            log(chalk.red('Missing Google API Key'))
            log(chalk.grey('Get yours from https://console.developers.google.com/'))
        }

        if (!process.env.GOOGLE_BASE_URI) {
            log(chalk.red('Missing GOOGLE_BASE_URI'))
            log(chalk.grey('Add ' + chalk.white('GOOGLE_BASE_URI=https://maps.googleapis.com/maps/api/geocode/json') + ' to your `.env` file'))
        }

        if (!process.env.REQ_FREQUENCY) {
            log(chalk.yellow('Missing REQ_FREQUENCY'))
            log(chalk.grey('defaulting to 1200ms'))
        }

    } else {

        // if (in_file === undefined || out_file === undefined) {
        //     log(chalk.red('Missing arguments'))
        //     log(chalk.white.underline('Usage'))
        //     log(chalk.green('csv-geocode ' + chalk.white('path/to/input.csv path/to/output.csv')))
        // } else {
        if (in_file) {
            fs.readFile(in_file, 'utf8', function (err, data) {
                if (err) {
                    console.error(chalk.red(err))
                }

                var dataset = dsv.csvParse(data, function (d) {
                    csv.push(d)
                })
                transformData()
            })

        }
    }


    function transformData() {
        for (let i = 0; i < csv.length; i++) {
            keysToLowerCase(csv[i])
        }
        sr = csv.length
        showData()
    }


    function showData() {
        header_columns = Object.keys(csv[0])
        for (let i = 0; i < header_columns.length; i++) {
            header_columns[i] = header_columns[i].toString().toLowerCase()
            // log(header_columns[i])
        }
        getHeaders()
    }


    function getHeaders() {
        is_address.forEach(function (i) {
            if (header_columns.includes(i)) {
                psw('Address column found: ', i)
                address_column = i
                createOutFile()
            }
        })
        // log(chalk.green(address_column))
        if (address_column === undefined) {
            console.error(chalk.red('Could not detect geocodable column!'))
        }
    }

    function createOutFile() {
        fs.writeFile(out_file, '', 'utf8', function (err) {
            if (err) {
                console.error(chalk.red('Failed to write output file!'))
                throw error
            } else {
                // log(chalk.bold(out_file) + ' has been created')
                psw(out_file + 'has been created')
                // processRows()
                oneByOne(0, previousRequestComplete = true, 'OK')
            }
            log('===========================================================================')
        })
    }

    function processRows() {
        if (address_column !== '') {
            for (let i = 0; i < csv.length; i++) {
                setTimeout(function () {
                    // log(csv[i][address_column])
                    sendRequest(csv[i], csv[i][address_column])
                }, i * frequency)
            }
        } else {
            console.error(chalk.red('No address column found!'))
        }
    }

    // send requests one by one instead of by interval
    function oneByOne(pr, previousRequestComplete, responseStatus) {
        if (responseStatus !== 'OVER_QUERY_LIMIT' || responseStatus !== 'REQUEST_DENIED') {
            if (previousRequestComplete === true && address_column !== '' && pr + 1 < csv.length) {
                log(pr, csv.length, csv[pr][address_column])
                pr++
                sendRequest(pr, csv[pr], csv[pr][address_column])
            }

        } else {
            console.error(chalk.red('Error:', responseStatus))
        }
    }


    function sendRequest(pr, row, address) {

        var addr = address.replace(/\s/g, '+')
        var req = process.env.GOOGLE_BASE_URI + '?address=' + addr + '&key=' + process.env.GOOGLE_API_KEY

        https.get(req, function (res) {
            var _d
            res.setEncoding('utf8')
            res.on('data', (d) => {
                // log('...getting chunks > response complete:', res.complete)
                // log(res.statusCode)
                // log(res.status)
                // process.stdout.write(d)
                // processResponse(row, d)
                _d += d
            })

            res.on('end', function () {
                // log('... done > response complete:', res.complete)
                // log(res.statusCode)
                // log(res.status)
                // log(typeof res)
                // log(Object.keys(res))
                // log('----------------')
                // log(_d)
                // processResponse(_d)
                previousRequestComplete = true
                oneByOne(pr, previousRequestComplete, res.status)
                processResponse(row, _d, pr)
                log('row', row, 'processed row', pr, 'prevComplete', previousRequestComplete)
            })
        })

    }




    function processResponse(row, d, k) {
        // log(row)
        // log(d)
        log(k)
        // progressbar(k)

        d = d.replace(/undefined{/, '{')
        d = d.replace(/\n/g, '')
        d = d.replace(/\r/g, '')

        // process.stdout.write(d) // writes JSON
        // log(d) // >> writes buffers

        response_data = JSON.parse(d.toString('utf8'))
        // response_data = JSON.parse(d.toString().trim())

        var data_row = ''

        if (k === 0) {
            log(chalk.red('k=0'))
        }

        // write column headers only once ;)
        if (k === 1) {
            psw('k = 1')
            var new_headers = ''
            var orig_values

            for (keys in row) {
                new_headers += keys
                new_headers += ','
            }

            // log(data_row)

            // Would be great not to hardcode these
            // var new_headers = ',' + Object.keys(response_data.results[0]) + ',status'
            new_headers += 'addr_components,formatted_address,lat,lng,location_type,place_id,types,status\n'
            // log(new_headers)

            fs.appendFile(out_file, new_headers, function (err) {
                if (err) {
                    console.error(chalk.red(err))
                }
                // else {
                //     log(d)
                //     log('\n----------\n', 'data has been written to', out_file)
                // }

            })
        }
        // end column headers


        // log('~~~~~~~~~~~~~~~~~~~~')
        // log('results count:', response_data.results.length, '\n')
        // log('response_data:', response_data, '\n')

        var l = response_data.results.length

        if (l === 0) {
            for (keys in row) {
                if (!isNaN(row[keys])) {
                    data_row += row[keys]
                    data_row += ','
                } else {
                    data_row += '"'
                    data_row += row[keys]
                    data_row += '",'
                }
            }

            data_row += ',,,,,,,' + response_data.status + '\n'
            err_count++

        }

        for (let i = 0; i < l; i++) {

            for (keys in row) {
                if (!isNaN(row[keys])) {
                    data_row += row[keys]
                    data_row += ','
                } else {
                    data_row += '"'
                    data_row += row[keys]
                    data_row += '",'
                }
            }

            var _addr_components = response_data.results[i].address_components
            var _formatted_address = response_data.results[i].formatted_address
            var _lat = response_data.results[i].geometry.location.lat
            var _lng = response_data.results[i].geometry.location.lng
            var _location_type = response_data.results[i].geometry.location_type
            var _place_id = response_data.results[i].place_id

            var _types = (function () {
                var types = '"'
                for (let j = 0; j < response_data.results[i].types.length; j++) {
                    types += ''
                    types += response_data.results[i].types[j]
                    if (j + 1 < response_data.results[i].types.length) {
                        types += ','
                    }
                }
                types += '"'
                return types
            })()

            var _status = response_data.status


            data_row += '' //_addr_components - not in use
            data_row += ',"'
            data_row += _formatted_address
            data_row += '",'
            data_row += _lat
            data_row += ','
            data_row += _lng
            data_row += ','
            data_row += _location_type
            data_row += ','
            data_row += _place_id
            data_row += ','
            data_row += _types
            data_row += ','
            data_row += _status
            data_row += '\n'

            // log(data_row)
        }


        fs.appendFile(out_file, data_row, function (err) {
            if (err) {
                console.error(chalk.red(err))
            }
            // else {
            //     log(data_row)
            //     log('\n----------\n', 'data has been written to', out_file)
            // }

        })

        if (pr === sr) {

            log('===========================================================================')
            log('Total entries: ' + sr)
            log('Processed: ' + pr)
            if (err_count > 0) {
                log('Errors: ' + chalk.red(err_count))
            } else {
                log('Errors: ' + err_count)
            }
            log('===========================================================================')
        }

    }
    // END codeAddress



})()
