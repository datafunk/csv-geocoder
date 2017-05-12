#!/usr/local/bin/node

require('dotenv').config()

const pjson = require('./package.json')
console.log('JS Geocoder v', pjson.version, 'started')

const http = require('http')
const https = require('https')
const fs = require('fs')
const d3 = require('d3-dsv')


module.exports = geocoder

var geocoder = (function () {

    var is_address = ['ad', 'add', 'addr', 'address']
    var header_columns = []
    var address_column = ''
    var k = 0 // entries count
    var err_count = 0
    var parse_errors = []
    var gcode_errors = []
    var in_file = process.argv[2]
    var out_file = process.argv[3]
    var latLng = ''
    var frequency = process.env.REQ_FREQUENCY

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

    if (in_file === undefined || out_file === undefined) {
        console.log('usage: node index.js path/to/input.csv path/to/output.csv')
    } else {

        fs.readFile(in_file, 'utf8', function (err, data) {
            if (err) {
                console.error(err)
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
        }
        getHeaders()
    }


    function getHeaders() {

        is_address.forEach(function (i) {
            if (header_columns.includes(i)) {
                // console.log('Address column found: ', i)
                address_column = i
                createOutFile()
            }
        })
    }

    function createOutFile() {

        // var orig_header = header_columns.toString()
        // fs.writeFile(out_file, orig_header, 'utf8', function (err) {

        fs.writeFile(out_file, '', 'utf8', function (err) {
            if (err) {
                throw error
            } else {
                // console.info(out_file, ' has been created', '\n----------\n')
                processRows()
            }
        })
    }

    function processRows() {

        if (address_column !== '') {
            for (let i = 0; i < csv.length; i++) {
                setTimeout(function () {
                    // console.log(csv[i][address_column])
                    sendRequest(csv[i], csv[i][address_column])
                }, i * frequency)
            }
        } else {
            console.error('No address column found!')
        }
    }


    function sendRequest(origData, address) {

        k++
        var addr = address.replace(/\s/g, '+')
        var req = process.env.PROVIDER_BASE_URI + '?address=' + addr + '&key=' + process.env.GOOGLE_API_KEY

        https.get(req, function (res) {
            var _d
            res.setEncoding('utf8')
            res.on('data', (d) => {
                // console.log('...getting chunks > response complete:', res.complete)
                // process.stdout.write(d)
                // processResponse(origData, d)
                _d += d
            })

            res.on('end', function () {
                // console.log('... done > response complete:', res.complete)
                // console.log(res.statusCode)
                // console.log(typeof res)
                // console.log(Object.keys(res))
                // console.log('----------------')
                // console.log(_d)
                // processResponse(_d)
                processResponse(origData, _d, k)
            })
        })

    }




    function processResponse(origData, d, k) {
        // console.log(origData)
        // console.log(d)
        // console.log(k)

        d = d.replace(/undefined{/, '{')
        d = d.replace(/\n/g, '')
        d = d.replace(/\r/g, '')

        // process.stdout.write(d) // writes JSON
        // console.log(d) // >> writes buffers

        response_data = JSON.parse(d.toString('utf8'))
        // response_data = JSON.parse(d.toString().trim())

        var data_row = ''

        if (k === 1) {
            // var new_headers = ',' + Object.keys(response_data.results[0]) + ',status'
            var new_headers = ''
            var orig_values

            for (keys in origData) {
                new_headers += keys
                new_headers += ','
            }

            // console.log(data_row)

            // Would be great not to hardcode these
            new_headers += 'addr_components,formatted_address,lat,lng,location_type,place_id,types,status\n'
            // console.log(new_headers)

            fs.appendFile(out_file, new_headers, function (err) {
                if (err) {
                    console.error(err)
                } else {
                    // console.log(d)
                    console.log('\n----------\n', 'data has been written to', out_file)
                }
            })
        }

        console.log('~~~~~~~~~~~~~~~~~~~~')
        console.log('results count:', response_data.results.length, '\n')

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
                    console.log(response_data.results[i].types[j])
                    types += ''
                    types += response_data.results[i].types[j]
                    types += ','
                }
                types += '"'
                return types
            })()

            console.log(_types)

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

        // console.log(data_row)


        fs.appendFile(out_file, data_row, function (err) {
            if (err) {
                console.error(err)
            } else {
                // console.log(data_row)
                console.log('\n----------\n', 'data has been written to', out_file)
            }
        })

    }
    // END codeAddress

})()
