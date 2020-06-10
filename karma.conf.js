module.exports = function (config) {
    config.set({
        frameworks: ["mocha", "chai"],
        browsers: ["ChromeHeadless"],
        reporters: ["spec"],
        basePath: process.cwd(),
        colors: true,
        files: ["test/dist/tests.bundle.js"],
        port: 9999,
        singleRun: true,
        concurrency: Infinity,
    });
};
