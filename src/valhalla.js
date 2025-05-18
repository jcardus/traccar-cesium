function getCountry(position) {
    const c = position?.address.split(',').slice(-1)[0].trim()
    switch (c) {
        case 'Brazil':
        case 'Brasil':
            return 'BR'
        case 'Portugal':
            return 'PT'
        case 'Chile':
            return 'CL'
        default:
            return c
    }
}
export async function snapToRoads(positions) {
    const body = {
        shape: positions.map(pos => ({lat: pos.latitude, lon: pos.longitude})),
        costing: "auto",
        shape_match: "map_snap",
        filters: {
            action: "include",
            attributes: ['matched.point']
        }
    };

    const response = await fetch(`https://valhalla-${getCountry(positions.find(p => p.address))}.fleetmap.org/trace_attributes`, {
        method: "POST",
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Valhalla error: ${response.status} ${errorText}`);
    }

    const {matched_points} = await response.json();

    return matched_points.map((pt, i) => {
        const {lon, lat} = pt
        return {
            ...positions[i], // keep original time, altitude, etc.
            latitude: lat,
            longitude: lon
        };
    });
}
