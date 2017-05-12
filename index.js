#!/usr/local/bin/node

require('dotenv').config()

const pjson = require('./package.json')
const http = require('http')
const https = require('https')
const fs = require('fs')
const d3 = require('d3-dsv')

// const my_ora = require('./my_ora')
// log(my_ora)

// const progressbar = require('./progressbar')

const chalk = require('chalk')

const log = console.log

log(chalk.white.underline('JS Geocoder v' + pjson.version) + '\n')

module.exports = geocoder

var geocoder = (function () {

    var is_address = ['ad', 'add', 'addr', 'address']
    var header_columns = []
    var address_column = undefined
    var k = 0 // entries count
    var err_count = 0
    var parse_errors = []
    var gcode_errors = []
    var in_file = process.argv[2]
    var out_file = process.argv[3]
    var latLng = ''
    var frequency = process.env.REQ_FREQUENCY || 1200

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

    if (in_file === undefined || out_file === undefined) {
        log(chalk.red('Missing arguments'))
        log(chalk.white.underline('Usage'))
        log(chalk.green('csv-geocode ' + chalk.white('path/to/input.csv path/to/output.csv')))
    } else {

        fs.readFile(in_file, 'utf8', function (err, data) {
            if (err) {
                console.error(chalk.red(err))
            }

            var dataset = d3.csvParse(data, function (d) {
                csv.push(d)
            })
            transformData()
        })
    }


    function transformData() {
        for (let i = 0; i < csv.length; i++) {
            keysToLowerCase(csv[i])
        }
        showData()
    }


    function showData() {

        header_columns = Object.keys(csv[0])
        for (let i = 0; i < header_columns.length; i++) {
            header_columns[i] = header_columns[i].toString().toLowerCase()
            log(header_columns[i])
        }
        getHeaders()
    }


    function getHeaders() {
        is_address.forEach(function (i) {
            if (header_columns.includes(i)) {
                // log('Address column found: ', i)
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
                log(chalk.green(out_file, ' has been created', '\n----------\n'))
                processRows()
            }
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


    function sendRequest(origData, address) {

        k++
        var addr = address.replace(/\s/g, '+')
        var req = process.env.GOOGLE_BASE_URI + '?address=' + addr + '&key=' + process.env.GOOGLE_API_KEY

        https.get(req, function (res) {
            var _d
            res.setEncoding('utf8')
            res.on('data', (d) => {
                // log('...getting chunks > response complete:', res.complete)
                // process.stdout.write(d)
                // processResponse(origData, d)
                _d += d
            })

            res.on('end', function () {
                // log('... done > response complete:', res.complete)
                // log(res.statusCode)
                // log(typeof res)
                // log(Object.keys(res))
                // log('----------------')
                // log(_d)
                // processResponse(_d)
                processResponse(origData, _d, k)
            })
        })

    }




    function processResponse(origData, d, k) {
        // log(origData)
        // log(d)
        // log(k)

        d = d.replace(/undefined{/, '{')
        d = d.replace(/\n/g, '')
        d = d.replace(/\r/g, '')

        // process.stdout.write(d) // writes JSON
        // log(d) // >> writes buffers

        response_data = JSON.parse(d.toString('utf8'))
        // response_data = JSON.parse(d.toString().trim())

        var data_row = ''

        // write column headers only once ;)
        if (k === 1) {

            var new_headers = ''
            var orig_values

            for (keys in origData) {
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


        log('~~~~~~~~~~~~~~~~~~~~')
        log('results count:', response_data.results.length, '\n')

        var l = response_data.results.length

        for (let i = 0; i < l; i++) {

            for (keys in origData) {
                if (!isNaN(origData[keys])) {
                    data_row += origData[keys]
                    data_row += ','
                } else {
                    data_row += '"'
                    data_row += origData[keys]
                    data_row += '",'
                }
            }

            var _addr_components = response_data.results[i].address_components
            var _formatted_address = response_data.results[i].formatted_address
            var _lat = response_data.results[i].geometry.location.lat
            var _lng = response_data.results[i].geometry.location.lng
            var _location_type = response_data.results[i].geometry.location_type
            var _place_id = response_data.results[i].place_id
            // var _types = response_data.results[0].types

            var _types = (function () {
                var types = '"'
                for (let j = 0; j < response_data.results[i].types.length; j++) {
                    log(response_data.results[i].types[j])
                    types += ''
                    types += response_data.results[i].types[j]
                    types += ','
                }
                types += '"'
                return types
            })()

            log(_types)

            var _status = response_data.status
        }

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


        fs.appendFile(out_file, data_row, function (err) {
            if (err) {
                console.error(chalk.red(err))
            }
            // else {
            //     log(data_row)
            //     log('\n----------\n', 'data has been written to', out_file)
            // }

        })

    }
    // END codeAddress

})()
