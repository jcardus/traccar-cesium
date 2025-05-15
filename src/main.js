
import {
    Cesium3DTileset,
    GpxDataSource,
    HeadingPitchRange,
    Viewer
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import {getPositions} from "./traccar.js";


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
    viewer.scene.primitives.add(await Cesium3DTileset.fromUrl(
        `https://tile.googleapis.com/v1/3dtiles/root.json?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`,
        {enableCollision: true}
    ))
    const gpxBlob = new Blob([await getPositions()], { type: 'application/gpx+xml' });
    const gpxUrl = URL.createObjectURL(gpxBlob);
    const dataSource = await GpxDataSource.load(gpxUrl, {clampToGround: true})
    await viewer.dataSources.add(dataSource);
    await viewer.zoomTo(dataSource, new HeadingPitchRange(0, -0.5, 2000))
}

init().then()
