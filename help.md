Requires a CSV file with header row and at least an address column named ['ad', 'add', 'addr', 'address']

Outputs a CSV file with geocodes, interpreted address, result status etc.

Currently only works with Google geocoding API, a valid API key is required. Provide it in a local .env file, see .env.example

-h -- help  show this help file
-i          /path/to/input.csv
-o          /path/to/output.csv
