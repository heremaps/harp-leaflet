/*
 * Copyright (C) 2017-2020 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

// tslint:disable:only-arrow-functions

import { MapViewEventNames } from "@here/harp-mapview";
import { waitForEvent } from "@here/harp-test-utils";

import { assert } from "chai";
import * as L from "leaflet";
import * as sinon from "sinon";
import { HarpGL } from "../src/index";

const GEO_EPSILON = 0.00000001;

describe("harp-leaflet", function () {
    let sandbox: sinon.SinonSandbox;
    let leafletMap: L.Map;
    let domElement: HTMLDivElement;
    let harpGLLayer: HarpGL;

    before(function () {
        sandbox = sinon.createSandbox({});

        domElement = document.createElement("div");
        domElement.style.position = "absolute";
        domElement.style.width = "200px";
        domElement.style.height = "200px";
        document.body.appendChild(domElement);

        leafletMap = L.map(domElement).setView([38.912753, -77.032194], 15);
    });

    after(function () {
        if (harpGLLayer !== undefined) {
            harpGLLayer.remove();
        }
        if (leafletMap !== undefined) {
            leafletMap.remove();
        }
        if (domElement !== undefined) {
            domElement.remove();
        }
        sandbox.restore();
    });

    it("addTo(map)", async function () {
        const onAddStub = sandbox.spy(HarpGL.prototype, "onAdd");
        harpGLLayer = new HarpGL({ theme: {} }).addTo(leafletMap);

        assert.equal(onAddStub.callCount, 1, "onAdd should be called");
    });

    it("position is set correctly", async function () {
        // `mapView.zoomLevel` is updated only when actual rendering occurs, so we force frame
        // update to ensure that zoom level is applied.
        harpGLLayer.mapView.update();
        await waitForEvent(harpGLLayer.mapView, MapViewEventNames.AfterRender);

        const lZoom = leafletMap.getZoom();
        const lCenter = leafletMap.getCenter();

        const harpCenter = harpGLLayer.mapView.geoCenter;
        const harpZoom = harpGLLayer.mapView.zoomLevel;

        assert.closeTo(harpCenter.latitude, lCenter.lat, GEO_EPSILON);
        assert.closeTo(harpCenter.longitude, lCenter.lng, GEO_EPSILON);
        assert.equal(harpZoom, lZoom);
    });

    it("L.map.setView updates MapView camera correctly", async function () {
        leafletMap.setView([40.707, -74.01], 12);

        // `mapView.zoomLevel` is updated only when actual rendering occurs.
        await waitForEvent(harpGLLayer.mapView, MapViewEventNames.AfterRender);

        const harpCenter = harpGLLayer.mapView.geoCenter;
        const harpZoom = harpGLLayer.mapView.zoomLevel;

        assert.closeTo(harpCenter.latitude, 40.707, GEO_EPSILON);
        assert.closeTo(harpCenter.longitude, -74.01, GEO_EPSILON);
        assert.equal(harpZoom, 12);
    });

    it("L.map.fitBounds updates MapView camera correctly", async function () {
        leafletMap.fitBounds(L.latLngBounds([51.412912, -5.998535], [43.052834, 8.4375]));

        // `mapView.zoomLevel` is updated only when actual rendering occurs.
        await waitForEvent(harpGLLayer.mapView, MapViewEventNames.AfterRender);

        const harpCenter = harpGLLayer.mapView.geoCenter;
        const harpZoom = harpGLLayer.mapView.zoomLevel;

        assert.closeTo(harpCenter.latitude, 47.39834916, GEO_EPSILON);
        assert.closeTo(harpCenter.longitude, 1.21948249, GEO_EPSILON);
        assert.equal(harpZoom, 4);
    });

    it("remove works", async function () {
        const onRemoveStub = sandbox.spy(HarpGL.prototype, "onRemove");

        harpGLLayer.remove();
        harpGLLayer = undefined!;
        assert.equal(onRemoveStub.callCount, 1, "onRemove should be called");
    });
});
