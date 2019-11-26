/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeLoader } from "@here/harp-mapview";
import { APIFormat, OmvDataSource } from "@here/harp-omv-datasource";
import HarpGL from "harp-leaflet";
import * as L from "leaflet";
import * as config from "./config";

const map = L.map("map").setView([38.912753, -77.032194], 15);
const popup = L.popup();

function onMapClick(e: L.LeafletMouseEvent) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

map.on("click", onMapClick as any);

L.marker([38.912753, -77.032194])
    .bindPopup("Hello <b>Harp GL</b>!<br>Whoa, it works!")
    .addTo(map)
    .openPopup();

const harpGL = new HarpGL({
    decoderUrl: "./build/decoder.bundle.js",
    theme: "resources/harp-map-theme/berlin_tilezen_base.json"
}).addTo(map);

const hereBaseDataSource = new OmvDataSource({
    baseUrl: "https://xyz.api.here.com/tiles/herebase.02",
    apiFormat: APIFormat.XYZOMV,
    styleSetName: config.styleSetName,
    maxZoomLevel: 17,
    authenticationCode: config.accessToken,
    concurrentDecoderScriptUrl: config.decoderPath
});

const osmBaseDataSource = new OmvDataSource({
    baseUrl: "https://xyz.api.here.com/tiles/osmbase/512/all",
    apiFormat: APIFormat.XYZMVT,
    styleSetName: config.styleSetName,
    maxZoomLevel: 17,
    authenticationCode: config.accessToken,
    concurrentDecoderScriptUrl: config.decoderPath
});

harpGL.mapView.addDataSource(hereBaseDataSource);
harpGL.mapView.addDataSource(osmBaseDataSource);

hereBaseDataSource.enabled = true;
osmBaseDataSource.enabled = false;

installButtonGroupHandler(
    {
        "theme-berlin-base": "resources/harp-map-theme/berlin_tilezen_base.json",
        "theme-berlin-reduced-day": "resources/harp-map-theme/berlin_tilezen_day_reduced.json",
        "theme-berlin-reduced-night": "resources/harp-map-theme/berlin_tilezen_night_reduced.json"
    },
    {
        default: "theme-berlin-base",
        onChange: async themeUri => {
            harpGL.mapView.theme = await ThemeLoader.load(themeUri);
        }
    }
);

installButtonGroupHandler(
    {
        "datasource-herebase": hereBaseDataSource,
        "datasource-osmbase": osmBaseDataSource
    },
    {
        default: "datasource-herebase",
        onChange: async newDataSource => {
            osmBaseDataSource.enabled = newDataSource === osmBaseDataSource;
            hereBaseDataSource.enabled = newDataSource === hereBaseDataSource;

            harpGL.mapView.update();
        }
    }
);

installButtonGroupHandler(
    {
        "location-washington": L.latLngBounds([38.906263, -77.06377], [38.858825, -76.96455]),
        "location-dubai": L.latLngBounds([25.200165, 55.264556], [25.190379, 55.285199]),
        "location-france": L.latLngBounds([51.412912, -5.998535], [43.052834, 8.4375]),
        "location-us": L.latLngBounds([51.289406, -131.660156], [24.527135, -71.367188]),
        "location-europe": L.latLngBounds([66.548263, -25.839844], [34.307144, 44.121094]),
        "location-earth": L.latLngBounds([78, -180], [-55, 180])
    },
    {
        noActive: true,
        default: "location-washington",
        onChange: async newBounds => {
            map.fitBounds(newBounds);
        }
    }
);

function installButtonGroupHandler<T>(
    schema: { [key: string]: T },
    options: { default: string; onChange: (v: T) => void; noActive?: boolean }
) {
    let currentKey = options.default;
    const buttons: { [key: string]: HTMLButtonElement } = {};
    function setValue(newKey: string) {
        const oldButton = buttons[currentKey];
        const newButton = buttons[newKey];

        if (options.noActive !== true) {
            oldButton.classList.remove("active");
            newButton.classList.add("active");
        }
        options.onChange(schema[newKey]);
        currentKey = newKey;
    }

    // tslint:disable-next-line:forin
    for (const key in schema) {
        const button = document.getElementById(key)! as HTMLButtonElement;
        buttons[key] = button;
        button.onclick = e => {
            e.stopPropagation();
            setValue(key);
        };
        if (options.noActive !== true && key === currentKey) {
            button.classList.add("active");
        }
    }
}
