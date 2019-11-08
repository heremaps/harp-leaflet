/*
 * Copyright (C) 2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import { GeoCoordinates, GeoCoordinatesLike } from "@here/harp-geoutils";
import { MapView, MapViewEventNames, MapViewOptions, MapViewUtils } from "@here/harp-mapview";
import bezier from "bezier-easing";
import { DomUtil, LatLng, Layer, LayerOptions } from "leaflet";
import "./draggable-patch";

type HarpLeafletOptions = Omit<LayerOptions & MapViewOptions, "canvas">;

const GEO_COORD = new GeoCoordinates(0, 0, 0);

const easing = bezier(0, 0, 0.25, 1);

// Smooth zoom block
interface ISmoothZoom {
    compute: (zoom: number, center: LatLng) => { zoom: number; center: LatLng };
    setZoomAndTimestamp: (zoom: number, center: LatLng, timestamp: number) => void;
}

function lerp(v0: number, v1: number, t: number): number {
    return v0 * (1 - t) + v1 * t;
}

function createSmoothZoom(delay: number): ISmoothZoom {
    let lastZoom: number | null = null;
    let lastCenter: LatLng | null = null;
    let startZoomTimestamp: number | null = null;

    return {
        compute: (zoom: number, center: LatLng) => {
            if (lastZoom === null) {
                lastZoom = zoom;
            } else if (lastZoom !== zoom) {
                if (startZoomTimestamp === null) {
                    startZoomTimestamp = performance.now();
                }

                const diff = performance.now() - startZoomTimestamp!;
                const progress = 1 - easing(Math.max(Math.min(diff / delay, 1), 0));

                const currentZoom = lerp(lastZoom, zoom, progress);
                const lat = lerp(lastCenter!.lat, center.lat, progress);
                const lng = lerp(lastCenter!.lng, center.lng, progress);

                return { zoom: currentZoom, center: ({ lat, lng } as any) as LatLng };
            }

            return { zoom, center };
        },
        setZoomAndTimestamp: (zoom: number, center: LatLng, timestamp: number) => {
            lastZoom = zoom;
            lastCenter = center;
            startZoomTimestamp = timestamp;
        }
    };
}

export default class HarpGL extends Layer {
    private m_glContainer!: HTMLElement;
    private m_glCanvas!: HTMLCanvasElement;
    private m_mapView!: MapView;
    private m_smoothZoom!: ISmoothZoom;
    private m_isMoving: boolean = false;

    constructor(private m_options: HarpLeafletOptions) {
        super((m_options as any) as LayerOptions);
    }

    initialize() {
        this.update();

        this.m_smoothZoom = createSmoothZoom(200); // 1/4 sec
    }

    getEvents() {
        return {
            // movestart: () => this.m_isMoving = true,
            moveend: () => (this.m_isMoving = false),
            zoomstart: () => (this.m_isMoving = false),
            zoomend: () => (this.m_isMoving = false),
            move: () => {
                this.m_isMoving = true;
                this.update();
            }, // sensibly throttle updating while panning
            zoomanim: this.setNewZoom, // applies the zoom animation to the <canvas>
            zoom: this.update // animate every zoom event for smoother pinch-zooming
        };
    }

    resize() {
        const size = this._map.getSize();

        this.m_glContainer.style.width = size.x + "px";
        this.m_glContainer.style.height = size.y + "px";
        this.m_mapView.resize(size.x, size.y);
    }

    onAdd() {
        if (!this.m_glContainer) {
            this.initContainer();
        }

        this.getPane("mapPane")!.parentNode!.appendChild(this.m_glContainer);

        this.initGL();

        // ...

        this.resize();

        this.m_mapView.addEventListener(MapViewEventNames.AfterRender, () => {
            if (this.m_isMoving) {
                return;
            }

            this.update();
        });

        this._map.on("resize", this.resize.bind(this));

        return this;
    }

    private initContainer() {
        const container = (this.m_glContainer = DomUtil.create("div", "leaflet-harpgl-layer"));

        const size = this._map.getSize();
        container.style.width = size.x + "px";
        container.style.height = size.y + "px";
    }

    private initGL() {
        const canvas = (this.m_glCanvas = document.createElement("canvas"));
        // this styles are needed to sync movement and zoom deltas with leaflet.
        Object.assign(canvas.style, {
            width: "100%",
            height: "100%"
        });

        this.m_glContainer.appendChild(canvas);

        this.m_mapView = new MapView({
            canvas,
            ...this.m_options
        });

        this.m_glContainer.appendChild(this.m_mapView.canvas);
    }

    private update() {
        if (this._map) {
            const { zoom, center } = this.m_smoothZoom.compute(
                this._map.getZoom(),
                this._map.getCenter()
            );

            const cameraDistance = MapViewUtils.calculateDistanceToGroundFromZoomLevel(
                this.m_mapView,
                zoom
            );

            GEO_COORD.latitude = center.lat;
            GEO_COORD.longitude = center.lng;
            GEO_COORD.altitude = cameraDistance;

            if (!geoCoordsSame(this.m_mapView.geoCenter, GEO_COORD)) {
                // Triggers update of mapview.worldCenter
                this.m_mapView.geoCenter = GEO_COORD;
            }
        }
    }

    private setNewZoom(e: any) {
        this.m_smoothZoom.setZoomAndTimestamp(e.zoom, e.center, performance.now());
    }

    get mapView() {
        return this.m_mapView;
    }
}

function geoCoordsSame(a: GeoCoordinatesLike, b: GeoCoordinatesLike): boolean {
    return (
        equalsWithEpsilon(a.latitude, b.latitude) &&
        equalsWithEpsilon(a.longitude, b.longitude) &&
        ((typeof a.altitude === "number" &&
            typeof b.altitude === "number" &&
            equalsWithEpsilon(a.altitude, b.altitude)) ||
            typeof a.altitude === typeof b.altitude)
    );
}

function equalsWithEpsilon(a: number, b: number) {
    return Math.abs(a - b) < 0.000000001;
}
