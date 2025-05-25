import {
    Cesium3DTileset,
    HeightReference,
    VelocityOrientationProperty,
    Viewer, CzmlDataSource, JulianDate, Timeline
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import {getPositions, getTrips, traccarPositionsToCzml} from "./traccar.js";
import {snapToRoads} from "./valhalla.js";
import {RadialGauge} from 'canvas-gauges'

let indexed = {}
let gaugeSpeed


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
    document.getElementById('loading-overlay').style.display = 'flex';
    try {
        initGauge()
        document.title = `Routes 3D ${import.meta.env.VITE_APP_VERSION}`
        Timeline.prototype.makeLabel = (time) => JulianDate.toDate(time).toLocaleString();
        viewer.animation.viewModel.timeFormatter = (date) => JulianDate.toDate(date).toLocaleTimeString()
        viewer.animation.viewModel.dateFormatter = (date) => JulianDate.toDate(date).toLocaleDateString()
        viewer.scene.primitives.add(await Cesium3DTileset.fromUrl(
            `https://tile.googleapis.com/v1/3dtiles/root.json?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`,
            {enableCollision: true}
        ))
        viewer.clock.onTick.addEventListener(() => {
            if (!viewer.clock.shouldAnimate) return;
            const date = JulianDate.toDate(viewer.clock.currentTime)
            const converted = Math.round(date.getTime()/1000)*1000
            if (indexed[converted]) {
                const value = Math.round(indexed[converted].speed * 1.852)
                if (value && value !== gaugeSpeed.value) {
                    gaugeSpeed.value = value
                }
            }
        });

        const [trip] = await getTrips();
        const positions = await getPositions(trip)
        positions.forEach(p => indexed[new Date(p.fixTime).getTime()] = p)
        const snappedPositions = await snapToRoads(positions)
        const czml = traccarPositionsToCzml(snappedPositions)
        const dataSource = await CzmlDataSource.load(czml)
        await viewer.dataSources.add(dataSource);
        await viewer.zoomTo(dataSource)
        const entity = dataSource.entities.values[0]
        const positionProperty = entity.position;
        entity.orientation = new VelocityOrientationProperty(positionProperty);
        entity.model = {
            uri: `${window.location.origin
            }${window.location.pathname
            }${window.location.pathname.endsWith('/') ? '' : '/'
            }CesiumMilkTruck.glb`,
            scale: 2.5,
            heightReference: HeightReference.CLAMP_TO_3D_TILE,
        }
        document.getElementById('follow').addEventListener('click',
            e => viewer.trackedEntity = e.target.checked ? entity : undefined
        )
        document.getElementById('lblFollow').innerText = `Seguir ${new URLSearchParams(window.location.search).get('name')}`
    } catch (e) {
        console.error(e)
        alert(e.message)
    }
    document.getElementById('loading-overlay').style.display = 'none';
}

function initGauge() {
    gaugeSpeed = new RadialGauge({
        renderTo: 'gauge-ps',
        width: 130,
        height: 130,
        units: 'km/h',
        title: "Speed",
        minValue: 0,
        maxValue: 180,
        majorTicks: ['0', '20', '40', '60', '80', '100', '120', '140', '160', '180'],
        minorTicks: 4,
        ticksAngle: 270,
        startAngle: 45,
        strokeTicks: true,
        highlights: [{ from: 140, to: 180, color: 'rgba(200, 50, 50, 0.75)'}],
        colorPlate: "#111",
        colorMajorTicks: "#ffffff",
        colorMinorTicks: "#cccccc",
        colorTitle: "#ffffff",
        colorUnits: "#cccccc",
        colorNumbers: "#ffffff",
        valueBox: true,
        valueInt: 0,
        valueDec: 0,
        colorValueText: "#ffffff",
        colorValueBoxBackground: "#222",
        colorNeedle: "#ff0000",
        colorNeedleEnd: "#ff0000",
        colorNeedleCircleOuter: "#ffffff",
        needleType: "line",
        needleWidth: 4,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        borderShadowWidth: 0,
        borders: false,
        borderOuterWidth: 0,
        colorBorderOuter: "#cccccc",
        colorBorderOuterEnd: "#888888",
        animationRule: "linear",
        fontNumbers: "Verdana",
        fontValue: "Verdana",
        fontValueSize: 40,
        fontTitleSize: 25,
        fontUnitsSize: 25,
        animatedValue: true
    });

    gaugeSpeed.draw();
}

init().then()
