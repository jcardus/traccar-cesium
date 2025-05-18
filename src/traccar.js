import {
    Cartographic,
    Ellipsoid,
} from "cesium";

export async function getTrips() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token')
    const response = await fetch(
        `${import.meta.env.VITE_TRACCAR_API_BASE_URL}/reports/trips${window.location.search}`,
        {
            headers: {
                 ...(token ? {'authorization': `Bearer ${token}`} : {}),
                'accept': 'application/json',
            }
        })
    if (response.ok) {
        return response.json()
    }
}

export async function getPositions(trip, format='') {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token')
    const deviceId = urlParams.get('deviceId')
    const query = new URLSearchParams({
        deviceId,
        from: trip.startTime,
        to: trip.endTime
    });
    const response = await fetch(
        `${import.meta.env.VITE_TRACCAR_API_BASE_URL}/positions${format}?${query.toString()}`,
        {
            headers: {
                ...(token ? {'authorization': `Bearer ${token}`} : {}),
                'accept': 'application/json',
            }
        })
    if (response.ok) {
        return response.json()
    }
}


export function traccarPositionsToCzml(positions) {
    if (!positions || positions.length < 2) throw new Error("At least 2 positions are required");
    const start = positions[0].fixTime;
    const end = positions[positions.length - 1].fixTime;

    const czml = [
        {
            id: "document",
            version: "1.0",
            clock: {
                interval: `${start}/${end}`,
                currentTime: start,
                multiplier: 2,
                range: "LOOP_STOP",
                step: "SYSTEM_CLOCK_MULTIPLIER"
            }
        },
        {
            id: "truck",
            position: {
                interpolationAlgorithm: "LINEAR",
                forwardExtrapolationType: "HOLD",
                cartesian: []
            },
            orientation: {
                // Static orientation for now; replace with computed quaternions if needed
                unitQuaternion: [0.0, 0.0, 0.0, 1.0]
            }
        },
        {
            id: "Polyline",
            polyline: {
                positions: {
                    cartesian: []
                },
                material: {
                    polylineOutline: {
                        color: { rgba: [100, 149, 237, 140] },
                        outlineWidth: 0
                    }
                },
                width: 12,
                clampToGround: true
            }
        }
    ];

    const modelPositionList = czml[1].position.cartesian;
    const polylineCartesianList = czml[2].polyline.positions.cartesian;


    for (const pos of positions) {
        const time = pos.fixTime;
        const cartesian = Ellipsoid.WGS84.cartographicToCartesian(
            Cartographic.fromDegrees(pos.longitude, pos.latitude, pos.altitude ?? 0)
        );

        modelPositionList.push(time);
        modelPositionList.push(cartesian.x, cartesian.y, cartesian.z);

        polylineCartesianList.push(cartesian.x, cartesian.y, cartesian.z);
    }

    return czml;
}
