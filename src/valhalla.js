const valhallaUrl = 'https://nominatim-cl-pt.fleetmap.org'
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

    const response = await fetch(`${valhallaUrl}/trace_attributes`, {
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
