Usage: csv-geocoder [options] [arguments]

Options:
  -h --help  show this help file
  -o output file path: /path/to/output.csv

Arguments:
  -i input file path: /path/to/input.csv
  -p provider: [google|osm] defaults to google, more to come

Description:

  Requires a CSV file with header row and at least an address column named ['ad', 'add', 'addr', 'address']

  Outputs a CSV file with geocodes, interpreted address, result status etc.

  Currently only works with Google geocoding API, a valid API key is required. Provide it in a local .env file, see .env.example

Environment variables:

  GOOGLE_API_KEY=your_api_key_here
  PROVIDER_BASE_URI=https://maps.googleapis.com/maps/api/geocode/json
  REQ_FREQUENCY=1200
