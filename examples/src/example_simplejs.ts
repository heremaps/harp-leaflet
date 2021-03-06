/*
 * Copyright (C) 2017-2020 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import { APIFormat, OmvDataSource } from "@here/harp-omv-datasource";
import { HarpGL } from "harp-leaflet";
import L from "leaflet";
import * as config from "./config";

const map = L.map("map", {
    // wheelDebounceTime: 10
}).setView([38.912753, -77.032194], 15);

L.marker([38.912753, -77.032194])
    .bindPopup("Hello <b>Harp GL</b>!<br>Whoa, it works!")
    .addTo(map)
    .openPopup();

const harpGL = new HarpGL({
    theme: "resources/harp-map-theme/berlin_tilezen_night_reduced.json",
}).addTo(map);

const dataSource = new OmvDataSource({
    baseUrl: "https://xyz.api.here.com/tiles/osmbase/512/all",
    apiFormat: APIFormat.XYZMVT,
    styleSetName: config.styleSetName,
    maxZoomLevel: 17,
    authenticationCode: config.accessToken,
    concurrentDecoderScriptUrl: config.decoderPath,
});

harpGL.mapView.addDataSource(dataSource);
