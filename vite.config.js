import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const cesiumSource = "node_modules/cesium/Build/Cesium";
// This is the base url for static files that CesiumJS needs to load.
// Set to an empty string to place the files at the site's root path
const cesiumBaseUrl = 'cesiumStatic'
const base = '/traccar-cesium'

// https://vitejs.dev/config/
export default defineConfig({
    base,
    define: {
        // Define relative base path in cesium for loading assets
        // https://vitejs.dev/config/shared-options.html#define
        CESIUM_BASE_URL: JSON.stringify(`${base}/${cesiumBaseUrl}`),
    },
    plugins: [
        // Copy Cesium Assets, Widgets, and Workers to a static directory.
        // If you need to add your own static files to your project, use the `public` directory
        // and other options listed here: https://vitejs.dev/guide/assets.html#the-public-directory
        viteStaticCopy({
            targets: [
                { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
                { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
                { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
                { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
            ],
        }),
    ],
    server: {
        proxy: {
            '/api/socket': 'ws://gps.rastreosat.com.br',
            '/api': 'http://gps.rastreosat.com.br',
        }
    }
});
