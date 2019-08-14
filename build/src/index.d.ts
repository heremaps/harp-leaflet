import { MapView, MapViewOptions } from '@here/harp-mapview';
import { Layer, LayerOptions } from 'leaflet';
import './draggable-patch';
interface HarpLeafletOptions extends LayerOptions, MapViewOptions {
    [key: string]: any;
}
export default class HarpGL extends Layer {
    private m_glContainer;
    private m_glCanvas;
    private m_mapView;
    private m_smoothZoom;
    private m_isMoving;
    private options;
    initialize(options: HarpLeafletOptions): void;
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
