const path = require("path");
const glob = require("glob");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const dir = path.resolve(__dirname);

const entries = glob.sync("./examples/src/*.ts").reduce(
    (entries, file) =>
        Object.assign(entries, {
            [file.match(/^.*\/([^\/]*)\.ts$/)[1]]: file
        }),
    {}
);

const harpMapThemePath = path.dirname(require.resolve("@here/harp-map-theme/package.json"));

module.exports = {
    context: dir,
    mode: "development",
    entry: entries,
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "./examples/build/")
    },
    externals: {
        three: "THREE",
        leaflet: "L"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".webpack.js", ".web.ts", ".web.js", ".js"],
        alias: {
            "harp-leaflet$": path.resolve(__dirname, "./src/index.ts"),
            "harp-leaflet": path.resolve(__dirname, "./src/")
        }
    },
    module: {
        rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, "./build/harp-leaflet.js"),
                to: path.resolve(__dirname, "./examples/vendor/harp-leaflet.js"),
                toType: "file",
                force: true
            },
            {
                from: require.resolve("@here/harp.gl/dist/harp.min.js"),
                to: path.resolve(__dirname, "./examples/vendor")
            },
            {
                from: require.resolve("@here/harp.gl/dist/harp-decoders.min.js"),
                to: path.resolve(__dirname, "./examples/vendor/")
            },
            {
                from: path.join(harpMapThemePath, "resources/"),
                to: path.resolve(__dirname, "./examples/resources/harp-map-theme"),
                toType: "dir"
            }
        ])
    ],
    devServer: {
        contentBase: path.resolve(__dirname, "examples"),
        publicPath: "/build/",
        open: true
    },
    stats: {
        all: false,
        timings: true,
        exclude: "/resources/",
        errors: true,
        entrypoints: true,
        warnings: true
    }
};
