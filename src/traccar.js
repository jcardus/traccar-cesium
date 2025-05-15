export async function getPositions() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token')
    const deviceId = urlParams.get('deviceId')
    let response = await fetch(
            `${import.meta.env.VITE_TRACCAR_API_BASE_URL}/reports/trips${window.location.search}`,
            {
                headers: {
                    'authorization': `Bearer ${token}`,
                    'accept': 'application/json',
                }
            })
    if (response.ok) {

        const [trip] = await response.json()
        const query = new URLSearchParams({
            deviceId,
            from: trip.startTime,
            to: trip.endTime
        });
        response = await fetch(
            `${import.meta.env.VITE_TRACCAR_API_BASE_URL}/positions/gpx?${query.toString()}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            })

        if (response.ok) {
            return response.text()
        }
    }
}
