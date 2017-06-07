#!/usr/bin/env node

var in_file = process.argv[2]
var out_file = process.argv[3]

if (!out_file) {
    console.log(in_file)
    var in_path = in_file.split('/')
    console.log(in_path)
    var file_name = in_path.pop()
    console.log(file_name)
    in_path = in_path.slice(0, -1)
    in_path = in_path.join('/')
    console.log(in_path)
    out_file = in_path + '/' + 'geocoded_' + file_name
    console.log(out_file)
}
