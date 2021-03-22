(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@here/harp-geoutils'), require('@here/harp-mapview'), require('leaflet')) :
    typeof define === 'function' && define.amd ? define(['exports', '@here/harp-geoutils', '@here/harp-mapview', 'leaflet'], factory) :
    (global = global || self, factory(global.HarpGL = {}, global.harp, global.harp, global.L));
}(this, (function (exports, harpGeoutils, harpMapview, leaflet) { 'use strict';

    /*
     * Copyright (C) 2019-2020 HERE Europe B.V.
     * Licensed under Apache 2.0, see full license in LICENSE
     * SPDX-License-Identifier: Apache-2.0
     */
    // @ts-ignore
    const oldUpdatePostition = leaflet.Draggable.prototype._updatePosition;
    // @ts-ignore
    leaflet.Draggable.prototype._updatePosition = function (...args) {
        setTimeout(() => {
            oldUpdatePostition.apply(this, args);
        }, 0);
    };

    /*
     * Copyright (C) 2019-2021 HERE Europe B.V.
     * Licensed under Apache 2.0, see full license in LICENSE
     * SPDX-License-Identifier: Apache-2.0
     */
    const GEO_COORD = new harpGeoutils.GeoCoordinates(0, 0);
    class HarpGL extends leaflet.Layer {
        constructor(m_options) {
            super(m_options);
            this.m_options = m_options;
            this.onResize = () => {
                const size = this._map.getSize();
                this.m_glContainer.style.width = size.x + "px";
                this.m_glContainer.style.height = size.y + "px";
                this.m_mapView.resize(size.x, size.y);
                this.resetTransform();
            };
        }
        initialize() {
            this.update();
            this.resetTransform = this.resetTransform.bind(this);
        }
        getEvents() {
            return {
                move: this.resetTransform,
                zoom: this.resetTransform,
                zoomanim: (event) => {
                    const evt = event;
                    this.setTransform(evt.zoom, evt.center);
                },
            };
        }
        onAdd(map) {
            if (!this.m_glContainer) {
                this.initContainer();
            }
            this.getPane("mapPane").appendChild(this.m_glContainer);
            if (this.m_mapView === undefined) {
                this.initMapView();
            }
            // ...
            this.onResize();
            map.on("resize", this.onResize);
            return this;
        }
        onRemove(map) {
            map.off("resize", this.onResize);
            if (this.m_mapView !== undefined) {
                this.m_mapView.dispose();
                this.m_mapView = undefined;
            }
            if (this.m_glContainer !== undefined) {
                this.m_glContainer.remove();
                this.m_glContainer = undefined;
            }
            return this;
        }
        resetTransform() {
            this.update();
            this.setTransform(this._map.getZoom(), this._map.getCenter());
        }
        setTransform(toZoom, toCenter) {
            const map = this._map;
            const fromZoom = map.getZoom();
            const scale = map.getZoomScale(toZoom, fromZoom);
            const mapPanePos = leaflet.DomUtil.getPosition(this.getPane("mapPane"));
            const origin = map.getPixelOrigin().subtract(mapPanePos);
            const newOrigin = map.project(toCenter, toZoom);
            newOrigin.x -= this.m_glContainer.clientWidth / 2 || 0;
            newOrigin.y -= this.m_glContainer.clientHeight / 2 || 0;
            newOrigin.x = newOrigin.x + mapPanePos.x;
            newOrigin.y = newOrigin.y + mapPanePos.y;
            const translate = new leaflet.Point(Math.round(origin.x * scale - newOrigin.x), Math.round(origin.y * scale - newOrigin.y));
            leaflet.DomUtil.setTransform(this.m_glContainer, translate, scale);
        }
        initContainer() {
            const container = this._map.createPane("harpgl");
            container.style.zIndex = "190"; // put it under tilePane
            const size = this._map.getSize();
            container.style.width = size.x + "px";
            container.style.height = size.y + "px";
            leaflet.DomUtil.addClass(container, "leaflet-zoom-animated");
            this.m_glContainer = container;
        }
        initMapView() {
            const canvas = document.createElement("canvas");
            // this styles are needed to sync movement and zoom deltas with leaflet.
            Object.assign(canvas.style, {
                width: "100%",
                height: "100%",
            });
            this.m_glContainer.appendChild(canvas);
            this.m_mapView = new harpMapview.MapView(Object.assign({ canvas }, this.m_options));
        }
        update() {
            if (!this._map) {
                return;
            }
            const zoom = this._map.getZoom();
            const center = this._map.getCenter();
            const cameraDistance = harpMapview.MapViewUtils.calculateDistanceToGroundFromZoomLevel(this.m_mapView, zoom);
            GEO_COORD.latitude = center.lat;
            GEO_COORD.longitude = center.lng;
            GEO_COORD.altitude = cameraDistance;
            if (!geoCoordsSame(this.m_mapView.geoCenter, GEO_COORD)) {
                // Triggers update of mapview.worldCenter
                this.m_mapView.geoCenter = GEO_COORD;
            }
        }
        get mapView() {
            return this.m_mapView;
        }
    }
    function geoCoordsSame(a, b) {
        return (equalsWithEpsilon(a.latitude, b.latitude) &&
            equalsWithEpsilon(a.longitude, b.longitude) &&
            ((typeof a.altitude === "number" &&
                typeof b.altitude === "number" &&
                equalsWithEpsilon(a.altitude, b.altitude)) ||
                (a.altitude === undefined && typeof a.altitude === typeof b.altitude)));
    }
    function equalsWithEpsilon(a, b) {
        return Math.abs(a - b) < 0.000000001;
    }

    exports.HarpGL = HarpGL;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
