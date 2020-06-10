import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import autoNamedExports from "rollup-plugin-auto-named-exports";

export default {
    input: "./src/index.ts",
    plugins: [
        resolve(),
        commonjs({
            namedExports: {
                "@here/harp-geoutils": ["GeoCoordinates"],
                "@here/harp-mapview": [
                    "MapView",
                    "MapViewEventNames",
                    "MapViewOptions",
                    "MapViewUtils",
                ],
                "@here/harp-omv-datasource": ["APIFormat", "OmvDataSource"],
                leaflet: ["DomUtil", "LatLng", "Layer", "LayerOptions"],
            },
        }),
        autoNamedExports(),
        typescript({
            tsconfig: "tsconfig.json",
            tsconfigOverride: {
                compilerOptions: {
                    module: "esnext",
                },
            },
        }),
    ],
    external: ["leaflet", "@here/harp-geoutils", "@here/harp-mapview", "@here/harp-omv-datasource"],
    output: {
        globals: {
            leaflet: "L",
            "@here/harp-geoutils": "harp",
            "@here/harp-mapview": "harp",
            "@here/harp-omv-datasource": "harp",
        },
        file: "./build/harp-leaflet.js",
        name: "L.HarpGL",
        format: "umd",
    },
};
