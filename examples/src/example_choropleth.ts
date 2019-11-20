/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import { GeoCoordinates } from "@here/harp-geoutils";
import { APIFormat, OmvDataSource } from "@here/harp-omv-datasource";
import HarpGL from "harp-leaflet";
import * as L from "leaflet";
import statesData from "../resources/us-states.json";
import * as config from "./config";

const map = L.map("map").setView([37.8, -96], 4);

function getColor(d: number) {
    return d > 1000
        ? "#800026"
        : d > 500
        ? "#BD0026"
        : d > 200
        ? "#E31A1C"
        : d > 100
        ? "#FC4E2A"
        : d > 50
        ? "#FD8D3C"
        : d > 20
        ? "#FEB24C"
        : d > 10
        ? "#FED976"
        : "#FFEDA0";
}

function style(feature: any) {
    return {
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.7,
        fillColor: getColor(feature.properties.density)
    };
}

// control that shows state info on hover
// @ts-ignore
const info = L.control();

info.onAdd = function() {
    this._div = L.DomUtil.create("div", "info");
    this.update();
    return this._div;
};

info.update = function(props: any) {
    this._div.innerHTML =
        "<h4>US Population Density</h4>" +
        (props
            ? "<b>" + props.name + "</b><br />" + props.density + " people / mi<sup>2</sup>"
            : "Hover over a state");
};

info.addTo(map);

function highlightFeature(e: L.LeafletEvent) {
    const layer = e.target;

    layer.setStyle({
        weight: 5,
        color: "#666",
        dashArray: "",
        fillOpacity: 0.7
    });

    // @ts-ignore
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

const geojson = L.geoJSON(statesData as any, {
    style,
    onEachFeature
}).addTo(map);

function resetHighlight(e: L.LeafletEvent) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e: L.LeafletEvent) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature: any, layer: L.Layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// @ts-ignore
map.attributionControl.addAttribution(
    'Population data &copy; <a href="http://census.gov/">US Census Bureau</a>'
);

// @ts-ignore
const legend = L.control({ position: "bottomright" });

legend.onAdd = () => {
    const div = L.DomUtil.create("div", "info legend");
    const grades = [0, 10, 20, 50, 100, 200, 500, 1000];
    const labels = [];
    let from;
    let to;

    for (let i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
            '<i style="background:' +
                getColor(from + 1) +
                '"></i> ' +
                from +
                (to ? "&ndash;" + to : "+")
        );
    }

    div.innerHTML = labels.join("<br>");
    return div;
};

legend.addTo(map);

const harpGL = new HarpGL({
    decoderUrl: "./build/decoder.bundle.js",
    theme: "resources/harp-map-theme/berlin_tilezen_night_reduced.json"
}).addTo(map);

const dataSource = new OmvDataSource({
    baseUrl: "https://xyz.api.here.com/tiles/osmbase/512/all",
    apiFormat: APIFormat.XYZMVT,
    styleSetName: config.styleSetName,
    maxZoomLevel: 17,
    authenticationCode: config.accessToken,
    concurrentDecoderScriptUrl: config.decoderPath
});

harpGL.mapView.addDataSource(dataSource);

harpGL.mapView.lookAt(new GeoCoordinates(16, -4, 0), 6000000);
