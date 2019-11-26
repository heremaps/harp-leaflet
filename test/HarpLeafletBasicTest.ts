// tslint:disable:only-arrow-functions

import { MapViewEventNames } from "@here/harp-mapview";
import { waitForEvent } from "@here/harp-test-utils";

import { assert } from "chai";
import * as L from "leaflet";
import * as sinon from "sinon";
import HarpGL from "../src/index";

describe("harp-leaflet", function() {
    let sandbox: sinon.SinonSandbox;
    let leafletMap: L.Map;
    let domElement: HTMLDivElement;
    let harpGLLayer: HarpGL;

    before(function() {
        sandbox = sinon.sandbox.create();

        domElement = document.createElement("div");
        domElement.style.position = "absolute";
        domElement.style.width = "200px";
        domElement.style.height = "200px";
        document.body.appendChild(domElement);

        leafletMap = L.map(domElement).setView([38.912753, -77.032194], 15);
    });

    after(function() {
        //    This doesn't work as for now
        //if (harpGLLayer !== undefined) {
        //    harpGLLayer.remove();
        //}
        //if (leafletMap !== undefined) {
        //    leafletMap.remove();
        //}
        if (domElement !== undefined) {
            domElement.remove();
        }
        sandbox.restore();
    });

    it("addTo(map)", async function() {
        const onAddStub = sandbox.spy(HarpGL.prototype, "onAdd");
        harpGLLayer = new HarpGL({ theme: {} }).addTo(leafletMap);

        assert.equal(onAddStub.callCount, 1, "onAdd should be called");
    });

    it("position is set correctly", async function() {
        // `mapView.zoomLevel` is updated only when actual rendering occurs, so we force frame
        // update to ensure that zoom level is applied.
        harpGLLayer.mapView.update();
        await waitForEvent(harpGLLayer.mapView, MapViewEventNames.AfterRender);

        const lZoom = leafletMap.getZoom();
        const lCenter = leafletMap.getCenter();

        const harpCenter = harpGLLayer.mapView.geoCenter;
        const harpZoom = harpGLLayer.mapView.zoomLevel;

        const geoEpsilon = 0.00000001;
        assert.closeTo(harpCenter.latitude, lCenter.lat, geoEpsilon);
        assert.closeTo(harpCenter.longitude, lCenter.lng, geoEpsilon);
        assert.equal(harpZoom, lZoom);
    });
});
