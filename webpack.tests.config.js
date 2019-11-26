const path = require("path");
const glob = require("glob");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const dir = path.resolve(__dirname);

const tests = glob.sync("./test/**/*.ts");

module.exports = {
    context: dir,
    mode: "development",
    entry: {
        tests: glob.sync("./test/**/*.ts")
    },
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "./test/dist/")
    },
    externals: {
        //three: "THREE",
        //leaflet: "L"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".webpack.js", ".web.ts", ".web.js", ".js"],
        alias: {
            "harp-leaflet$": path.resolve(__dirname, "./src/index.ts"),
            "harp-leaflet": path.resolve(__dirname, "./src/")
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    onlyCompileBundledFiles: true,
                    compilerOptions: {
                        declaration: false
                    }
                }
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            path.join(__dirname, "test/index.html"),
            require.resolve("three/build/three.min.js"),
            require.resolve("mocha/mocha.js"),
            require.resolve("mocha/mocha.css")
            //require.resolve("mocha-webdriver-runner/dist/mocha-webdriver-client.js"),
            // {
            //     from: path.join(harpMapThemePath, "resources/"),
            //     to: path.resolve(__dirname, "./examples/resources/harp-map-theme"),
            //     toType: "dir"
            // }
        ])
    ],
    devServer: {
        contentBase: path.resolve(__dirname, "test"),
        open: true
    }
};
