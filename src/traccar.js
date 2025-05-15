export async function getPositions() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token')
    const response = await fetch(
            `${import.meta.env.VITE_TRACCAR_API_BASE_URL}/positions/gpx${window.location.search}`,
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
