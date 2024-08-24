import { empty } from "jet-ext/utils";
import {Map, View, MapEvent} from 'ol';

import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import LineString from 'ol/geom/LineString';
import WKT from 'ol/format/WKT.js';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {Circle as CircleStyle, Fill, Stroke, Style, Icon, Text, RegularShape} from 'ol/style';
import * as olExtent from 'ol/extent';
import Select, { SelectEvent } from 'ol/interaction/Select';
import { singleClick } from 'ol/events/condition';
import {
  Pointer as PointerInteraction,
  defaults as defaultInteractions,
} from 'ol/interaction.js';

import hexToHsl from 'hex-to-hsl';

import { CMapUtils, IMapProvider, Coords } from "./IMapProvider";
import { MapType, Direction } from "~/services/types";
import type { MapObject, MapPoint, MapRoute } from "~/services/types";

import 'ol/ol.css';

import { regiMapProvider, mapSettings } from "~/composables/map";


declare const $turf: any;
declare const $moment: any;

class Drag extends PointerInteraction {
    constructor(own: IMapProvider){
        super({
            handleDownEvent: handleDownEvent,
            handleDragEvent: handleDragEvent,
            handleMoveEvent: handleMoveEvent,
            handleUpEvent: handleUpEvent,
        });
        
        this._own = own;

        /**
         * @type {import("../src/ol/coordinate.js").Coordinate}
         * @private
         */
        this.coordinate_ = null;

        /**
         * @type {string|undefined}
         * @private
         */
        this.cursor_ = 'pointer';

        /**
         * @type {Feature}
         * @private
         */
        this.feature_ = null;

        /**
         * @type {string|undefined}
         * @private
         */
        this.previousCursor_ = undefined;
    }
};

/**
 * @param {import("../src/ol/MapBrowserEvent.js").default} evt Map browser event.
 * @return {boolean} `true` to start the drag sequence.
 */
function handleDownEvent(evt: MapEvent): boolean {
    const map: Map = evt.map;
    const feature: Feature | null = map.forEachFeatureAtPixel(evt.pixel, (f: Feature) => {
        return f;
    });

    if (feature) {
        const props = feature.getProperties();
        if (props.route){
            return false;
        }
        
        this.coordinate_ = evt.coordinate;
        this.feature_ = feature;
        return true;
    }

    return false;
};

/**
 * @param {import("../src/ol/MapBrowserEvent.js").default} evt Map browser event.
 */
function handleDragEvent(evt: MapEvent) {
    const deltaX = evt.coordinate[0] - this.coordinate_[0];
    const deltaY = evt.coordinate[1] - this.coordinate_[1];

    const geometry = this.feature_.getGeometry();
    geometry.translate(deltaX, deltaY);

    this.coordinate_[0] = evt.coordinate[0];
    this.coordinate_[1] = evt.coordinate[1];
}

/**
 * @param {import("../src/ol/MapBrowserEvent.js").default} evt Event.
 */
function handleMoveEvent(evt: MapEvent) {
    if (this.cursor_) {
        const map: Map = evt.map;
        const feature: Feature|null = map.forEachFeatureAtPixel(evt.pixel, (f: Feature) => {
            return f;
        });
        const element = evt.map.getTargetElement();
        if (feature) {
            if (element.style.cursor != this.cursor_) {
              this.previousCursor_ = element.style.cursor;
              element.style.cursor = this.cursor_;
            }
        } else if (this.previousCursor_ !== undefined) {
            element.style.cursor = this.previousCursor_;
            this.previousCursor_ = undefined;
        }
    }
}

/**
 * @return {boolean} `false` to stop the drag sequence.
 */
function handleUpEvent(e: MapEvent) {
    const route = this._own?._route,
          props = this.feature_?.getProperties();
    if ( route && props ){
        const pt = (props.stop||props.point);
        route.points.filter( (p: any) => p.id === pt.id ).forEach( (p: any) => {
            p.lat = e.coordinate[1];
            p.lon = e.coordinate[0];
        });
        this._own._drawRoute(route);
    }
    this.coordinate_ = null;
    this.feature_ = null;
    return false;
}


export class OlMapProvider extends CMapUtils implements IMapProvider {
    name: String = "OlMapProvider";
    
    _map: Map|null = null;
    
    _node: DOMNode|null = null;
    
    _route: MapRoute|null = null;
    
    get zoom(): Number {
        return this._map?.getView()?.getZoom();
    };
    
    set zoom(val: Number){
        const view = this._map?.getView();
        if ( view ){
            view.setZoom( val );
        }
    };
    
    get center(): Coords {
        const view = this._map?.getView();
        const center = ( view ) ? view.getCenter() : [0, 0];
        return {lon: center[0], lat: center[1]};
    };
    
    set center(val: Coords) {
        const view = this._map?.getView();
        if ( view ){
            view.setCenter([val.lon, val.lat]);
        }
    };
    
    get node(): DOMNode{
        return this._node;
    }
    
    /** 
    * @param {Object} args {node: DOMNode}
    */
    async init(args: any): Promise<any>{
        return new Promise((resolve, reject)=>{
            this._node = args.node;
            
            const map: Map = new Map({
                target: args.node,
                layers: [
                  new TileLayer({
                    source: new OSM(),
                  }),
                ],
                view: new View({
                    projection: 'EPSG:4326',
                    center: args.center,
                    zoom: 14,
                    enableRotation: false,
                    constrainResolution: true
                }),
                interactions: defaultInteractions().extend([new Drag(this)])
            });
            
            map.on('error', (e: any) => {
                console.log('ERR (map init)', e);
                reject(e);
            });
            
            map.on('singleclick', (e: MapEvent)=>{
                console.log('singleclick', e);
                map.forEachFeatureAtPixel(e.pixel, (feature: Feature)=>{
                    const props = feature.getProperties();
                    let item: MapObject|null = null;
                    if (props.route){
                        item = props.route;
                    } else if (props.stop){
                        item = props.stop;
                    } else if (props.point){
                        item = props.point;
                    } else {
                        console.log("unknown selected feature", feature);
                    }
                    if ( item ) {
                        const route : MapRoute = this._route;
                        if ( e.originalEvent.ctrlKey ){
                            let n = route.points.findIndex( (p:MapPoint) => p.id === item.id );
                            if ( n > -1 ){
                                route.points.splice(n, 1);
                                this._drawRoute(this._route);
                            }
                            return;
                        } else if (e.originalEvent.shiftKey){
                            const pt = $turf.point(e.coordinate),
                               _line = $turf.lineString( route.points?.map( p => [p.lon, p.lat] ));
                            const snapped = $turf.nearestPointOnLine(_line, pt);
                            const index: number = snapped.properties.index + 1;
                            const prev = route.points.at(index - 1);
                            const point: MapPoint = {
                                id:  `${ (new Date()).getTime() }`,
                                lon: e.coordinate[0],
                                lat: e.coordinate[1], 
                                type: MapType.point,
                                locationId: null,
                                location: null,
                                direction: prev.direction,
                                color: prev.color
                            };
                            route.points.splice(index, 0, point);
                            route.points.forEach( (p, n) => {p.index = n;});
                            this._drawRoute(route);
                            return;
                        }
                        const evt = new Event("mapoint", {bubbles: true});
                        
                        evt.data = {
                            item,
                            action: e.originalEvent.shiftKey ? "add" : "select",
                            coords: {
                                lon: e.coordinate[0],
                                lat: e.coordinate[1]
                            }
                        }
                        document.dispatchEvent(evt);
                    }
                   
                }, {
                    hitTolerance: true
                });
            });
            
            this._map = map;
            
            console.log("OL(map)", map);
            
            resolve(true);
        });
    };   //init
    
    /**
    * Clean layer's & selection
    */
    clean(id?: String): void{
        const cleans = ["routes-layer", "stops-layer", "vehicles-layer", "parkings", "geozones"];
        const _cleans= ["track-point"];
        
        let s, n;
        
        this._map?.getLayers().forEach( l => {
            try {
                s = (l.get) ? l.get('name') : 'xxx$$$xxx';
                n = cleans.findIndex( c => c === s );
                if ( 
                        ( n > -1 )
                     && ( empty(id) )
                    ){
                    this._emptyLayer(s);
                } else if ( /^(track)+/.test(s) ){
                    if (
                            ( empty(id) )
                         || ( s.indexOf(id) > -1 )
                       ) {
                        _cleans.push( l );
                    }
                }
            } catch(e){
                console.log('ERR (clean)', e);
            }
        });
        
        _cleans.forEach( l => this._rmLayer( l ) );
    }   //clean
    
    /**
    *  Get a layer by name
    *  @param {String} name - layer 
    */
    _getLayer(name: String, create = false) : Object {
        let layer = null;
        this._map?.getLayers().forEach( l => {
            if ( name === l.get('name') ){
                layer = l;
            }
        });
        if ( create ){
            if ( !layer ){
                layer = new VectorLayer();
                layer.set('name', name);
                this._map.addLayer(layer);
                switch (name) {
                    case "vehicles-layer":
                        layer.setStyle( this._vehicleStyle );
                        layer.setZIndex(999);
                        break;
                    case "routes-layer":
                        layer.setStyle( this._routeStyle );
                        break;
                    case "stops-layer":
                        layer.setStyle( this._stopStyle );
                        break;
                    case "parkings":
                        layer.setStyle( this._parkingStyle );
                        break;
                    case "geozones":
                        layer.setStyle( this._geozonesStyle );
                        break;
                    default:
                        if ( /^(track)+/.test(name) ){
                            layer.setStyle( this._trackStyle );
                        }
                        break;
                }
            }
        }
        return layer;
    };  //_getLayer
    
    _rmLayer(layer: any) : void {
        var layer = ((typeof layer === "string")||(layer instanceof String)) ? this._getLayer(layer) : layer;
        if (layer){
            this._map.removeLayer(layer);
        }
    };  //_rmLayer
    
    _emptyLayer(name: String) : void {
        const layer = this._getLayer(name);
        if (layer){
            const source = layer.getSource();
            if (source){
                source.forEachFeature( (f: Feature) => source.removeFeature(f) );
            }
        }
    };  //_emptyLayer
    
    
    _routeStyle = (feature: Feature) => {
        const props = feature.getProperties();
        const { direction, color } = props;

        //line
        const styles = [
            new Style({
                stroke: new Stroke({
                    color: color,
                    lineJoin: "bevel",
                    width: 4
                })
            })
        ];
/* TODO: no
        feature.getGeometry().forEachSegment( (start: Coords, end: Coords) => {
            if ( $turf.distance(start, end, {units:'kilometers'}) > 0.25 ){
                        
                        const dx = end[0] - start[0];
                        const dy = end[1] - start[1];
                        const rotation = Math.atan2(dy, dx);                        
                        styles.push(
                            new Style({
                                geometry: new Point(start),
                                image: new RegularShape({
                                    fill: new Fill({color}),
                                    points: 3,
                                    radius: 6,
                                    rotation: -rotation,
                                    angle: Math.PI / 2 // rotate 90°
                                })
                            })
                        );
            }
        } );
*/
        return styles;
    };   //routeStyle
    
    
    _stopStyle = (feature: Feature) => {
        const { stop, point } = feature.getProperties(),
              zoom  = this._map.getView().getZoom();
              
        const style = [new Style({
                            text: ( (zoom > 13)&&(stop) )
                                    ? new Text({
                                        font: '12px Arial,sans-serif',
                                        fill: new Fill({
                                              color: "#263238"
                                        }),
                                        stroke: new Stroke({
                                            color: '#fff',
                                            width: 3
                                        }),
                                        offsetX: 18,
                                        offsetY: -18,
                                        text: stop.name || ''
                                    })
                                    : undefined,
                            image: new CircleStyle({
                                        fill: new Fill({ color: (stop||point).color }),
                                        stroke: new Stroke({
                                            color: `rgba(255, 255, 255, 0.75)`,
                                            width: stop ? 4 : 2
                                        }),
                                        radius: stop ? 10 : 4
                            })
                        })
                        
        ];
        
        if ( stop?.short ){
            style.push(new Style({
                            text: new Text({
                                    font: '8px Arial,sans-serif',
                                    text: stop.short,
                                    fill: new Fill({color: "#fff"})
                            })
                        })
            );
        }
        
        return style;
    };   //stopStyle
    
    _vehicleStyle = feature => {
        const props = feature.getProperties();
        const { vehicle } = props;
        const style = [new Style({
                                    image: new Icon({
                                                        scale: [0.18, 0.18],
                                                        src: vehicle.selected ? this.TRACK_ICONS["POINTER_SELECTED"]: this.TRACK_ICONS["POINTER"],
                                                        rotation: vehicle.telemetry.heading * (Math.PI/180)
                                    })
                                })];
        if ( vehicle.route ){
            style.push(new Style({
                    text: new Text({
                                    font: '8px Arial,sans-serif',
                                    text: vehicle.route.number,
                                    fill: new Fill({color: "#333"})
                    })
            }));
        }
        return style;
    };   //vehiStyle
    
    _parkingStyle = feature => {
        const props = feature.getProperties();
        const { parking } = props;
        return new Style({
                                    image: new Icon({
                                                        scale: [0.28, 0.28],
                                                        src: this.TRACK_ICONS["PARKING"]
                                    }),
                                    text: new Text({
                                                font: '11px Arial,sans-serif',
                                                text:   parking.phone || parking.name,
                                                offsetY: 18, 
                                                fill: new Fill({
                                                      color: "#263238"
                                                }),
                                                stroke: new Stroke({
                                                    color: '#fff',
                                                    width: 3
                                                })
                                    })
                                });
    };   //parkingStyle

    _trackStyle = (feature: Feature) => {
        const TRACK_ICONS = this.TRACK_ICONS;
        const point  = feature.getProperties()?.point || false;
        const zoom  = this._map.getView().getZoom();

        let style = null;
        if ( !point ){
            //line
            const lineSettings = feature.getProperties()?.lineSettings || false;
            console.log('lineSettings', lineSettings, feature);
            style = new Style({
                                stroke: new Stroke({
                                color: lineSettings?.color || '#2951DB',
                                width: lineSettings?.width || 4
                            })
            });
        } else {
            const pointSettings = point?.pointSettings || false;
            
            if( 
                (!!pointSettings) 
                &&
                ((point.status == 'OVERSPEEDING' && pointSettings.showSpeedUps == 'none')
                || (point.status == 'STOP' && pointSettings.showStops == 'none')
                || (point.status == 'PARKING' && pointSettings.showParking == 'none')) 
            ) {
                //TODO:
            }
            
            let geometry = new Point([point.lon, point.lat]);

            if ( 
                    ('STOP' === point.status)
                 || ('PARKING' === point.status)
                 || point.firstOverspeed
            ) {
                let text = point.firstOverspeed 
                            ? '' + Math.round(point.speed)
                            : ('PARKING' === point.status) ? 'P' : '\u23F8';
                style = new Style({
                            geometry,
                            image: new CircleStyle({
                                        fill: new Fill({ color: point.firstOverspeed ? "#d50000" : "#0091ea" }),
                                        stroke: new Stroke({
                                            color: `rgba(255, 255, 255, 0.75)`,
                                            width: 4
                                        }),
                                        radius: 10
                            }),
                            text: new Text({
                                    font: '8px Arial,sans-serif',
                                    text,
                                    fill: new Fill({color: "#fff"})
                            })
                        });
            } else if ( point.ab ){
                style = new Style({
                                    geometry,
                                    image: new Icon({
                                                        src: TRACK_ICONS[(point.ab === 1) ? 'STARTING': 'ENDING'],
                                                        scale: [0.3, 0.3],
                                                        anchorOrigin: 'bottom-left',
                                                        anchorXUnits: 'pixels',
                                                        anchorYUnits: 'pixels',
                                                        anchor: [20, 12],
                                                        rotateWithView: true
                                        })

                });
                
            } else if (
                            ('MOVING' === point.status)
                        &&  ( zoom >= point.zoom )
            ){
                style = new Style({
                                    geometry,
                                    image: new Icon({
                                                        src: TRACK_ICONS[point.status],
                                                        scale: [0.7, 0.7],
                                                        anchorOrigin: 'bottom-left',
                                                        anchorXUnits: 'pixels',
                                                        anchorYUnits: 'pixels',
                                                        anchor: [12, 12],
                                                        rotation: point.heading * (Math.PI/180),
                                                        rotateWithView: true
                                        })

                });
            }
        }
        return style;
    };  //_trackStyle

    _onePointStyle = feature => {
        const props = feature.getProperties();
        const { point } = props;
        const style = [new Style({
                                    image: new Icon({
                                                        scale: [0.18, 0.18],
                                                        src: this.TRACK_ICONS["POINTER_SELECTED"],
                                                        rotation: point.heading * (Math.PI/180)
                                    }),
                                    text: new Text({
                                        font: '8px Arial,sans-serif',
                                        text: $moment(point.time).format("HH:mm"),
                                        fill: new Fill({color: "#333"})
                                    })
                                })];
        return style;
    };      //_onePointStyle
    
    _geozonesStyle = feature => {
        const view  = this._map.getView(),
              props = feature.getProperties();
        const { geozone } = props;
        const color = geozone._color || -65536;
        
        let style = null;
            
        switch (geozone.geotype){
            case 'LINE':
                /*  TODO: нах?
                    const coords  = feature.getGeometry().getCoordinates();
                    const radians = (78271.517 * Math.cos(coords[0][1] * Math.PI / 180));
                */
                style = new Style({
                            stroke: new Stroke({
                                color: CMapUtils.colorFromInt(color, 0.6),
                                width: geozone.width * 1000
                            })
                });
                break;
            case 'POLYGON':
                style = new Style({
                            stroke: new Stroke({
                                color: CMapUtils.colorFromInt(color, 0.75),
                                width: 2
                            }),
                            fill: new Fill({
                                color: CMapUtils.colorFromInt(color, 0.18)
                            })
                });
                break;
            case 'CIRCLE':
                let r = ((geozone.width||0.01) * 1000 / 500) / 500 * (1 << view.getZoom());
                style = new Style({
                            image: new CircleStyle({
                                radius: r, 
                                //scale: view.getResolutionForZoom(17.5) / view.getResolution(),
                                fill: new Fill({
                                    color: CMapUtils.colorFromInt(color, 0.18)
                                }),
                                stroke: new Stroke({
                                    color: CMapUtils.colorFromInt(color, 0.75),
                                    width: 2
                                })
                            })
                        });            
                break;
                
            default:
                console.log('undefined geozone type', geozone);
                break;
        }
        
        return style;
    };      //_geozonesStyle
    
    /**
    *   Create a Features & drawing line
    *   don`t use external: see drawRoutes
    */
    _drawRoute( route: MapRoute ) : void {
        if ( (route.points?.length||0) < 1){
            return; 
        }
        
        CMapUtils.splitPoints(route);
        
        let layer: VectorLayer = this._getLayer("routes-layer", true);
        
        let source: VectorSource|null = layer.getSource();
        if ( !source ){
            source = new VectorSource();
            layer.setSource(source);
        } else {
            source.clear();
        }
/*        
        let hsl = hexToHsl(route.color);
        
        hsl[0]  = (hsl[0] + 30) > 255 ? 224 : hsl[0] + 30;
        hsl[2]  = (hsl[2] - 10) < 0 ? 0 : hsl[2] - 9;
        let color1 = `hsl(${ hsl[0] - 30 }, ${ hsl[1] }%, ${ hsl[2] }%)`,
            color2 = `hsl(${ hsl[0] }, ${ hsl[1] }%, ${ hsl[2] + 10 }%)`;
*/
        let color1 = "#558B2F", /* blue-accent-2 */
            color2 = "#FF9800"; /* light-blue-accent-3 */
        
        source.addFeatures([
                new Feature({   
                                geometry: new LineString(route.points
                                                            .filter( (p:MapPoint) => (p.direction === Direction.forward)||(p.direction === Direction.both) )
                                                            .map( (p:MapPoint) => [p.lon, p.lat] )
                                            ),
                                color: color1,
                                route: route
                }),
                new Feature({
                                geometry: new LineString(route.points
                                                            .filter( (p:MapPoint) => (p.direction === Direction.backward)||(p.direction === Direction.both) )
                                                            .map( (p:MapPoint) => [p.lon, p.lat] )
                                            ),
                                color: color2,
                                route: route
                })
        ]);
        
        layer = this._getLayer("stops-layer", true);
        source= layer.getSource();
        if ( !source ){
            source = new VectorSource();
            layer.setSource(source);
        } else {
            source.clear();
        }
        
        /** add a stops & route-points */
        source.addFeatures(
            route.points.map( (p: MapPoint) => {
                                p.color = (p.direction === Direction.forward) ? color1 : color2;
                                return new Feature({
                                    geometry: new Point([p.lon, p.lat]),
                                    stop: (p.locationID||p.location?.id) ? p : null,
                                    point: (p.locationID||p.location?.id) ? null : p
                                });
                            })

        );
        
        this._route = route;
        
    };  //drawRoute
    
    
    drawRoutes(routes: Array<MapRoute>) : void {
        
        routes.forEach( (route: any) => {
            if ( !route.color ){
                route.color = CMapUtils.nextColor();
            }
            CMapUtils.splitPoints(route);
            this._drawRoute(route);
        } );
        
        
        const layer = this._getLayer("routes-layer");
        if (layer){
            const bounds = layer.getSource().getExtent();

            if ( !olExtent.isEmpty(bounds) ){
                const view = this._map.getView();
                view.setCenter(olExtent.getCenter(bounds));
                view.fit(bounds, {padding: [40, 40, 40, 40]});
            }
        }
        
    };  //drawRoutes
    
    
    drawVehicles(vehicles: Array): void {
        const map = this._map;
        
        const layer = this._getLayer("vehicles-layer", true);
        
        let source = layer.getSource();
        if ( !source ){
            source = new VectorSource();
            layer.setSource(source);
        }
        
        vehicles.forEach( vehicle => {
            vehicle.type = "vehicle";
            if (!!vehicle.telemetry){
                const coords =  [vehicle.telemetry.lon, vehicle.telemetry.lat];  

                let f = source.getFeatureById(vehicle.id);
                if ( f ){
                    f.getGeometry().setCoordinates(coords);
                    f.setProperties({vehicle}); 
                } else {
                    f = new Feature({
                        geometry: new Point(coords),
                        vehicle
                    });
                    f.setId(vehicle.id);
                    source.addFeature(f);
                }
            }
        });
    };  //drawVehicles
    
    selectVehicles(vehicles: Array): void{
        if (vehicles?.length > 0){
            this.drawVehicles(vehicles);
            const ext = olExtent.boundingExtent( vehicles.filter( v => !!v.telemetry ).map( v => {
                return [v.telemetry.lon, v.telemetry.lat];
            }));
            if ( !olExtent.isEmpty( ext ) ){
                const view = this._map.getView();
                view.setCenter(olExtent.getCenter(ext));
                if (vehicles.length > 1){
                    view.fit(ext, {padding: [40, 40, 40, 40]});
                }
            }
        } else {
            const rems = [];
            this._emptyLayer("vehicles-layer");
            this._map.getLayers().forEach( l => {
                let s = l.get('name');
                if ( /^(track)+/.test(s) ){
                    rems.push(l);
                }
            });
            rems.forEach( r => {
                try {
                    this._rmLayer(r);
                } catch(e){
                }
            });
        }
    };
    
    vehiclesFitBounds(){
        const layer = this._getLayer("vehicles-layer");
        if (layer){
            const bounds = layer.getSource().getExtent();

            if ( !olExtent.isEmpty(bounds) ){
                const view = this._map.getView();
                view.fit(bounds, {padding: [40, 40, 40, 40]});
            }
        }
    };  //vehiclesFitBounds

    setCenter(coords: Object, selFeatures?: Boolean): void{
        const { lon, lat } = coords;
        if ( !lon || !lat ){
            return;
        }
        
        this._map.getView().setCenter([lon, lat]);
        if (selFeatures){
            mapSettings.selected.select(coords);
        }
    };
    
    routeFitBounds(route: Object): void {
        const layer = this._getLayer("routes-layer");
        
        if (layer){
            const bounds = layer.getSource().getExtent();

            if ( !olExtent.isEmpty(bounds) ){
                const view = this._map.getView();
                view.setCenter(olExtent.getCenter(bounds));
                view.fit(bounds, {padding: [40, 40, 40, 40]});
            }
        }
    };  //routeFitBounds
    
    /**
    * @param {Object} vehicle
    */
    drawTrack(vehicle: Object, opts?: Object): void {
        const id = `track-${ vehicle.id }`;
        const _opts = Object.assign({movePointer: false, fitBounds: true}, vehicle.opts);
        if (opts){
            Object.keys(opts).map( k => { 
                if ( typeof opts[k] !== "undefined" ){
                    _opts[k] = opts[k];
                }
            });
        }
        
        if ( 
                (vehicle.track)
             && (vehicle.track.points?.length > 0)
           ){
            try {
                CMapUtils.normalizeTrack(vehicle);

                const trackLine = {
                            type: 'Feature',
                            id,
                            geometry: {
                                type: 'LineString',
                                coordinates: vehicle.track.points.map( point => [point.lon, point.lat] )
                            },
                            properties: {
                                name: id,
                                vehicle: vehicle,
                                lineSettings: _opts
                            }
                };
                
                const trackPoints = {
                            type: 'FeatureCollection',
                            name: `${ id }-points`,
                            id:   `${ id }-points`,
                            features: vehicle.track.points.map( point => {
                                return {
                                            type: "Feature",
                                            geometry: {
                                                type: "Point",
                                                coordinates: [point.lon, point.lat]
                                            },
                                            properties: { vehicle, point}
                                };
                            }),
                            properties: {
                                name: `${ id }-points`,
                                vehicle: vehicle
                            }
                };
                
                //line
                let layer = this._getLayer(id, true),
                    source = new VectorSource({
                        features: new GeoJSON().readFeatures(trackLine)
                    });
                layer.setSource(source);
                if (_opts.fitBounds){
                    const bounds = source.getExtent();
                    if ( !olExtent.isEmpty(bounds) && (trackLine.geometry.coordinates.length > 20) ){
                        this._map.getView().fit(bounds, {padding: [30, 30, 30, 30]});
                    }
                }
                //points
                layer = this._getLayer(trackPoints.name, true);
                source = new VectorSource({
                    features: new GeoJSON().readFeatures(trackPoints)
                });
                layer.setSource(source);
                
                if (_opts.movePointer){
                    this.drawTrackPoint(vehicle.track.points[vehicle.track.points.length - 1]);
                }
            } catch(e){
                console.log('ERR (track)', e);
            }
        } else {
            this._rmLayer(id);
            this._rmLayer(`${ id }-points`);
        }
        
    };  //drawTrack

    drawTrackPoint(point?: Object): void {
        
        var point = point?.raw ? point.raw : point;
        
        const LL_ID = "track-point";
        if ( point ) {
            const view = this._map.getView(),
                  layer = this._getLayer(LL_ID, true);
            layer.setStyle( this._onePointStyle );
            layer.setZIndex(1001);
            
            let source = layer.getSource();
            if ( !source ){
                source = new VectorSource();
                layer.setSource(source);
            }
            let coords = [point.lon, point.lat],
                f = source.getFeatureById(LL_ID);
            if ( f ){
                f.getGeometry().setCoordinates(coords);
                f.setProperties({
                    name: LL_ID,
                    point
                }); 
            } else {
                f = new Feature({
                            geometry: new Point(coords),
                            point
                });
                f.setId(LL_ID);
                source.addFeature(f);
            }
            const ext = view.calculateExtent( this._map.getSize() );
            if ( !olExtent.containsCoordinate(ext, coords) ){
                view.setCenter(coords);
            }
        } else {
            this._rmLayer( LL_ID );
        }
    };  //drawTrackPoint
    
    
    drawParking(parking?: Object): void{
        const layer = this._getLayer("parkings", true);
        let source = layer.getSource();
        if ( !source ){
            source = new VectorSource();
            layer.setSource(source);
        }
        if ( parking ) {
            let f = source.getFeatureById(parking.id);
            if ( !f ){
                let coords = [parking.lon, parking.lat];
                f = new Feature({
                            geometry: new Point(coords),
                            parking
                });
                f.setId( parking.id );
                source.addFeature(f);
                this._map.getView().setCenter(coords);
            }
        } else {
            //TODO:
        }
    };  //drawParking

    drawGeozone(geozone: Object): void{
        console.log('geozone', geozone);
        const layer = this._getLayer("geozones", true);
        let source = layer.getSource();
        if ( !source ){
            source = new VectorSource();
            layer.setSource(source);
        }
        let f = source.getFeatureById(geozone.id);
        if ( !f ){
            const wkt = new WKT();
            f = wkt.readFeature( geozone.polygonText );
            f.setProperties({ geozone });
            f.setId( geozone.id );
            source.addFeature( f );
            console.log('feature', f);
        }
            
        //centering & fit map
        const bounds = f.getGeometry().getExtent();
        if ( !olExtent.isEmpty(bounds) ){
            this._map.getView().setCenter(olExtent.getCenter(bounds));
        }
    };  //drawGeozone
    
    select(item: Object): void{
        mapSettings.selected.select(item);
    };
    
    updateSize(){
        this._map?.update();
    };
    
    destroy(): void{
        try {
            if (this._node){
                this._node.innerHTML = "";
                this._node.removeAttribute("style");
            }
        } catch(e){
        }
    };  //destroy
    
    static register():void{
        regiMapProvider({
                            id: "osm", 
                            title: "Open Street Map", 
                            description: "Некоммерческий веб-картографический проект", 
                            component: OlMapProvider,
                            disabled: false
        });
    };
};      //class OlMapProvider 

OlMapProvider.register();