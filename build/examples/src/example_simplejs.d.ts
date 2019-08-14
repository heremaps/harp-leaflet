interface ILeafletExtended {
    HarpGL: any;
}
declare const LE: typeof L & ILeafletExtended;
declare let harp: typeof import('@here/harp-omv-datasource') & typeof import('@here/harp-geoutils');
declare const map: L.Map;
declare const harpGL: any;
declare const geoJsonDataSource: import("@here/harp-omv-datasource").OmvDataSource;
