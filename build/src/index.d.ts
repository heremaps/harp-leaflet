import { MapView, MapViewOptions } from '@here/harp-mapview';
import { Layer, LayerOptions } from 'leaflet';
import './draggable-patch';
declare type HarpLeafletOptions = Omit<LayerOptions & MapViewOptions, "canvas">;
export default class HarpGL extends Layer {
    private m_options;
    private m_glContainer;
    private m_glCanvas;
    private m_mapView;
    private m_smoothZoom;
    private m_isMoving;
    constructor(m_options: HarpLeafletOptions);
    initialize(): void;
    getEvents(): {
        moveend: () => boolean;
        zoomstart: () => boolean;
        zoomend: () => boolean;
        move: () => void;
        zoomanim: (e: any) => void;
        zoom: () => void;
    };
    resize(): void;
    onAdd(): this;
    private initContainer;
    private initGL;
    private update;
    private setNewZoom;
    readonly mapView: MapView;
}
export {};
