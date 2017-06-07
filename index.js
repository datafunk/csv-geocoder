#!/usr/bin/env node

require('dotenv').config()

const pjson = require('./package.json')
const psui = require('./psui')
const psw = psui.psw

const http = require('http')
const https = require('https')
const fs = require('fs')
const d3 = require('d3-dsv')

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
    var frequency = process.env.REQ_FREQUENCY || 1200
    var previousRequestComplete = false
    var csv = []

    psui.parse()
    var in_file = psui.input
    var out_file = psui.output
    var provider = psui.provider || 'google'

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
            log('Missing Google API Key')
            process.exit()
        }

        if (!process.env.GOOGLE_BASE_URI) {
            log('Missing GOOGLE_BASE_URI')
            process.exit()
        }

        // if (!process.env.REQ_FREQUENCY) {
        //     log('Missing REQ_FREQUENCY')
        //     log('defaulting to 1200ms')
        // }
    }

    if (in_file) {
        fs.readFile(in_file, 'utf8', function (err, data) {
            if (err) {
                console.error('Error: ', err)
                process.exit(1)
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
        sr = csv.length
        showData()
    }


    function showData() {
        header_columns = Object.keys(csv[0])
        for (let i = 0; i < header_columns.length; i++) {
            header_columns[i] = header_columns[i].toString().toLowerCase()
        }
        getHeaders()
    }


    function getHeaders() {
        is_address.forEach(function (i) {
            if (header_columns.includes(i)) {
                address_column = i
                createOutFile()
            }
        })

        if (address_column === undefined) {
            console.error('Could not detect geocodable column!')
            process.exit(1)
        }
    }

    function createOutFile() {
        if (!out_file) {
            var in_path = in_file.split('/')
            var file_name = in_path.pop()
            in_path = in_path.slice(0, in_path.length)
            in_path = in_path.join('/')
            out_file = in_path + '/' + 'geocoded_' + file_name
        }
        fs.writeFile(out_file, '', 'utf8', function (err) {
            if (err) {
                console.error('Failed to write output file!')
                process.exit(1)
            } else {
                // first write the column headers
                var new_headers = ''
                // get source file column headers
                for (keys in csv[0]) {
                    new_headers += keys
                    new_headers += ','
                }
                // Would be great not to hardcode these, but for the time being...
                // var new_headers = ',' + Object.keys(response_data.results[0]) + ',status'
                new_headers += 'addr_components,formatted_address,lat,lng,location_type,place_id,types,status\n'

                fs.appendFile(out_file, new_headers, function (err) {
                    if (err) {
                        console.error(err)
                        process.exit(1)
                    }
                })

                // now start processing
                oneByOne(pr, previousRequestComplete = true, 'OK')
            }
            log('===========================================================')
        })
    }

    // send requests one by one instead of by interval
    function oneByOne(pr, previousRequestComplete, responseStatus) {
        if (responseStatus == 'OVER_QUERY_LIMIT' || responseStatus == 'REQUEST_DENIED') {
            console.error('Response Error:', responseStatus)
            process.exit(1)
        }

        if (provider == 'google') {
            if (previousRequestComplete === true && address_column !== '' && pr + 1 < csv.length) {
                providerGoogle(pr, csv[pr], csv[pr][address_column])
            }
        }

        if (provider == 'osm') {
            if (previousRequestComplete === true && address_column !== '' && pr + 1 < csv.length) {
                providerOSM(pr, csv[pr], csv[pr][address_column])
            }
        }

        // else {
        //     console.error('No alternative provider available')
        //     process.exit(1)
        // }
    }

    function providerGoogle(pr, row, address) {
        var addr = address.replace(/\s/g, '+')
        var req = process.env.GOOGLE_BASE_URI + '?address=' + addr + '&key=' + process.env.GOOGLE_API_KEY
        sendRequest(pr, row, req)
    }

    function providerOSM(pr, row, address) {
        var addr = address.replace(/\s/g, '+')
        var req = process.env.OSM_BASE_URI + '?q=' + addr + '&format=json'
        sendRequest(pr, row, req)
    }

    function sendRequest(pr, row, req) {

        https.get(req, function (res) {
            var _d
            res.setEncoding('utf8')
            res.on('data', (d) => {
                _d += d
            })

            res.on('end', function () {
                previousRequestComplete = true
                pr++
                oneByOne(pr, previousRequestComplete, res.status)
                processResponse(row, _d, pr)
            })
        })

    }



    function processResponse(row, d, pr) {

        d = d.replace(/undefined{/, '{')
        d = d.replace(/\n/g, '')
        d = d.replace(/\r/g, '')

        // process.stdout.write(d) // writes JSON
        response_data = JSON.parse(d.toString('utf8'))

        var data_row = ''
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

        }


        fs.appendFile(out_file, data_row, function (err) {
            if (err) {
                console.error(err)
                process.exit(1)
            }
        })


        pr++
        psui.progress(pr, sr)

        if (pr === sr) {
            log('\r')
            log('===========================================================')
            log('Total entries  ' + sr)
            log('Processed      ' + pr)
            log('Errors         ' + err_count)
            log('Geocoded CSV   ' + out_file)
            log('===========================================================')
        }

    }
    // END codeAddress



})()
