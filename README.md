# CSV-Geocoder

This project succeeds [js.geocoder](https://bitbucket.org/datafunk/js.geocoder/) (0.4.0), which is a web / GUI for geocoding addresses using Google Maps API. It is still a _work in progress_!

__csv-geocoder 0.5.0__ is built based on the aforementioned __js.geocoder__. When completed the initial porting, it did no longer made sense to house it in the same repo. I could rather see to update its predecessor to use this on the backend and keep satisfying the needs of the original target audience.

__0.5.0__ is functional, but lacks tests, documentation, help utilities and guaranteed to be buggy. The plan is to complete these, iron out the bugs and eventually publish to npm.

A note on versioning, I first saw the nodejs port as a direct part of the original project, but it became clear that it won't be compatible with __js.geocoder__. With the aim to follow semantic versioning I bumped it to _1.0.0-beta_. The project however isn't quite that mature yet. So since I moved it to a separate repo with a new name, I was able to downgrade. To indicate its origins, the first commit was pushed as 0.5.0.
