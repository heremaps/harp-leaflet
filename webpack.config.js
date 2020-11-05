const path = require("path");
const glob = require("glob");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const dir = path.resolve(__dirname);

const entries = glob.sync("./examples/src/*.ts").reduce(
    (entries, file) =>
        Object.assign(entries, {
            [file.match(/^.*\/([^\/]*)\.ts$/)[1]]: file,
        }),
    {}
);

const harpMapThemePath = path.dirname(require.resolve("@here/harp-map-theme/package.json"));
const leafletDist = path.dirname(require.resolve("leaflet/dist/leaflet.js"));

module.exports = {
    context: dir,
    mode: "development",
    entry: entries,
    output: {
        filename: "build/[name].bundle.js",
        path: path.resolve(__dirname, "./examples"),
    },
    externals: {
        three: "THREE",
        leaflet: "L",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".webpack.js", ".web.ts", ".web.js", ".js"],
        alias: {
            "harp-leaflet$": path.resolve(__dirname, "./src/index.ts"),
            "harp-leaflet": path.resolve(__dirname, "./src/"),
        },
    },
    module: {
        rules: [{ test: /\.tsx?$/, loader: "ts-loader" }],
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, "./build/harp-leaflet.js"),
                to: "vendor/harp-leaflet.js",
                toType: "file",
                force: true,
            },
            {
                from: require.resolve("@here/harp.gl/dist/harp.min.js"),
                to: "vendor/",
            },
            {
                from: require.resolve("@here/harp.gl/dist/harp-decoders.min.js"),
                to: "vendor/",
            },
            {
                from: require.resolve("three/build/three.min.js"),
                to: "vendor/",
            },
            {
                from: path.join(harpMapThemePath, "resources/"),
                to: "resources/harp-map-theme",
                toType: "dir",
            },
            {
                from: leafletDist,
                to: "vendor/",
            },
        ]),
    ],
    devServer: {
        contentBase: path.resolve(__dirname, "examples"),
        open: true,
    },
    stats: {
        all: false,
        timings: true,
        exclude: "/resources/",
        errors: true,
        entrypoints: true,
        warnings: true,
    },
};
