/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as config from "./config";

interface ILeafletExtended {
    HarpGL: any;
}

// @ts-ignore
const LE: typeof L & ILeafletExtended = L as any;
declare let harp: typeof import("@here/harp-omv-datasource") & typeof import("@here/harp-geoutils");

const map = LE.map("map", {
    // wheelDebounceTime: 10
}).setView([38.912753, -77.032194], 15);

LE.marker([38.912753, -77.032194])
    .bindPopup("Hello <b>Harp GL</b>!<br>Whoa, it works!")
    .addTo(map)
    .openPopup();

const harpGL = new LE.HarpGL({
    theme: "resources/harp-map-theme/berlin_tilezen_night_reduced.json"
}).addTo(map);

const dataSource = new harp.OmvDataSource({
    baseUrl: "https://xyz.api.here.com/tiles/osmbase/512/all",
    apiFormat: harp.APIFormat.XYZMVT,
    styleSetName: config.styleSetName,
    maxZoomLevel: 17,
    authenticationCode: config.accessToken,
    concurrentDecoderScriptUrl: config.decoderPath
});

harpGL.mapView.addDataSource(dataSource);

harpGL.mapView.lookAt(new harp.GeoCoordinates(16, -4), 6000000);
