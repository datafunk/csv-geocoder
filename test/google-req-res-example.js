// request example
{
    address: string,
    location: LatLng,
    placeId: string,
    bounds: LatLngBounds,
    componentRestrictions: GeocoderComponentRestrictions,
    region: string
}

//https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=YOUR_API_KEY

// result example
results[]: {
    types[]: string,
    formatted_address: string,
    address_components[]: {
        short_name: string,
        long_name: string,
        postcode_localities[]: string,
        types[]: string
    },
    partial_match: boolean,
    place_id: string,
    postcode_localities[]: string,
    geometry: {
        location: LatLng,
        location_type: GeocoderLocationType
        viewport: LatLngBounds,
        bounds: LatLngBounds
    }
}
