import {
    Cesium3DTileset,
    HeightReference,
    VelocityOrientationProperty,
    Viewer, CzmlDataSource
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import {getPositions, getTrips, traccarPositionsToCzml} from "./traccar.js";
import {snapToRoads} from "./valhalla.js";


const viewer = new Viewer("app", {
    baseLayerPicker: false,
    imageryProvider: false,
    homeButton: false,
    fullscreenButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    geocoder: false,
    infoBox: false,
    selectionIndicator: false,
});

async function init() {
    document.title = `Routes 3D ${import.meta.env.VITE_APP_VERSION}`
    viewer.scene.primitives.add(await Cesium3DTileset.fromUrl(
        `https://tile.googleapis.com/v1/3dtiles/root.json?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`,
        {enableCollision: true}
    ))
    const [trip] = await getTrips();
    const positions = await getPositions(trip)
    const snappedPositions = await snapToRoads(positions)
    const czml = traccarPositionsToCzml(snappedPositions)
    const dataSource = await CzmlDataSource.load(czml)
    await viewer.dataSources.add(dataSource);
    await viewer.zoomTo(dataSource)
    const entity = dataSource.entities.values[0]
    const positionProperty = entity.position;
    entity.orientation = new VelocityOrientationProperty(positionProperty);
    entity.model = {
        uri: `${window.location.origin}${window.location.pathname}/CesiumMilkTruck.glb`,
        scale: 2.5,
        heightReference: HeightReference.CLAMP_TO_3D_TILE,
    }
    document.getElementById('follow').addEventListener('click',
            e => viewer.trackedEntity = e.target.checked ? entity : undefined
    )
}

init().then()
