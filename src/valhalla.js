import distance from '@turf/distance';
import { point } from '@turf/helpers';

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

function interpolateIfNeeded(positions, maxGapMeters = 10) {
    const result = [];

    for (let i = 0; i < positions.length - 1; i++) {
        const from = positions[i];
        const to = positions[i + 1];

        const distKm = distance(
            point([from.longitude, from.latitude]),
            point([to.longitude, to.latitude])
        );
        const distMeters = distKm * 1000;

        result.push(from); // always keep the original point

        if (distMeters > maxGapMeters) {
            const steps = Math.floor(distMeters / maxGapMeters);

            for (let j = 1; j < steps; j++) {
                const t = j / steps;
                const newDate = new Date(from.fixTime).getTime() + Math.round((new Date(to.fixTime) - new Date(from.fixTime)) * t)
                const interpolated = {
                    latitude: from.latitude + (to.latitude - from.latitude) * t,
                    longitude: from.longitude + (to.longitude - from.longitude) * t,
                    fixTime: new Date(newDate).toISOString()
                };

                result.push(interpolated);
            }
        }
    }

    result.push(positions[positions.length - 1]); // add the last point
    return result;
}


export async function snapToRoads(_positions) {
    const positions = interpolateIfNeeded(_positions)
    const body = {
        shape: positions.map(pos => ({lat: pos.latitude, lon: pos.longitude})),
        costing: "auto",
        shape_match: "map_snap",
        filters: {
            action: "include",
            attributes: ['matched.point']
        }
    };
    try {
        const response = await fetch(`https://valhalla-${getCountry(positions.find(p => p.address))}.fleetmap.org/trace_attributes`, {
            method: "POST",
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`${response.status} ${errorText}`)
            return _positions
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
    } catch (e) {
        console.error(e)
        return _positions
    }
}
