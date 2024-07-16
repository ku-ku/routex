import * as turf from '@turf/turf';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString.js';
import Polygon from 'ol/geom/Polygon.js';
import WKT from 'ol/format/WKT.js';
import { parseColor } from "vuetify/lib/util/colorUtils";

const _TRACK_ICONS = {
        POINTER: 'map-images/map-pointer.png',
        POINTER_SELECTED: 'map-images/map-pointer-blue.png',
        PARKING: 'map-images/map-track-stop.png',
        STARTING:'map-images/map-track-a.png',
        ENDING:  'map-images/map-track-b.png',
        MOVING:  'map-images/arrow-direction.png',
        HOT:     'map-images/flag-red.png'
};

(() => {
    const config = useRuntimeConfig();

    Object.keys(_TRACK_ICONS).forEach( async k => {
        try {
            /* @vite-ignore */
            _TRACK_ICONS[k] = config.baseURL + _TRACK_ICONS[k];
        } catch(e) {
            console.log('ERR(image load)', e);
        }
    } );
});

window["$turf"] = turf;

let _c = -1;
const _COLORS = [
                    "#4527a0", /* indigo */
                    "#AFB42B", /* lime-darken-2 */
                    "#6a1b9a", /* deep-purple */
                    "#16ef00", /* green */
                    "#283593", /* navy */
                    "#b600ff", /* purple */
                    "#1565c0", /* dark-blue */
                    "#558b2f", /* green */
                    "#00838f", /* teal */
                    "#2e7d32", /* green */
                    "#795548", /* brown */
                    "#0288d1"  /* blue */
];

export enum Direction {
    unknown = -1,
    forward = 0,
    backward= 1,
    any     = 2  //for end-stop forward/backward
};

export enum STOP_TYPES {
        stop      = 'bd78259f-7b64-ad44-e040-007f02002b0e',
        end       = 'bd78259f-7b66-ad44-e040-007f02002b0e',
        project   = 'f7ed3774-82af-4dc7-80cf-02836a53f365',
        checkpoint= 'dcc1d9a7-46ca-0134-e040-007f02005bc1',
        other     = 'bd78259f-7b65-ad44-e040-007f02002b0e'
};


export type Coords = {
    lon:   number,
    lat:   number,
    id?:   string,
    name?: string,
    dir?:  number
};   //Coords     


export class CMapUtils {
    
    SPEED_LIMIT = 90;
    
    TRACK_ICONS = _TRACK_ICONS;
    
    static nextColor(): String {
        _c++;
        if (_c > _COLORS.length - 1){
            _c = 0;
        }
        return _COLORS[_c];
    };
    /**
    * Split forward/backward route-points
    * stops shorting by type
    */
    static splitPoints(route: any){
        if ( (route.points?.length||0) < 1){
            return;
        }
        route.points.forEach( (p: any, n: number) => {
            p.index = n;
        });
        const ends = route.points.filter( (p:any) => (p.pointTypeId===STOP_TYPES.end) || /^(END)+/.test(p.pointType));
        route.endStops = ends.length;
        let startStop  = ends.at(0),
            n = (route.endStops < 3) ? route.points.length : ends[1].index;

        route.points.forEach( (p: any, i: number) => {
            p.direction = ((route.endStops < 3) || (i < n)) ? Direction.forward : Direction.backward;
            if ( p.name ){
                p.short = '';
                if ( /(\sАП)+/i.test(p.name) || /^(АП\s)+/i.test(p.name) ){
                    p.short = 'АП';
                } else if ( /(\sАС)+/i.test(p.name) ) {
                    p.short = 'АС';
                } else if ( /(\sАК)+/i.test(p.name) ) {
                    p.short = 'АК';
                } else if ( /(ВОКЗАЛ)+/i.test(p.name) || /(\sАВ)+/i.test(p.name) ){
                    p.short = 'АВ';
                }
            }
        });
        
        if ( 3 === route.endStops ){
            ends[1].direction = Direction.any;
        }
        
    };  //splitPoints
    
    /**
    * Vehicle track normalization: oversped & etc...
    * @param {Object} track
    */
    static normalizeTrack(vehicle: any): void {
        let track = vehicle.track,
            prev  = { lat: 0, lon: 0, dir: 0, heading: 0, distance: 65000000, stopId: 'xxx' },
            stops: turf.FeatureCollection | null = turf.featureCollection(
                (vehicle.route?.points?.filter( (p: any) => (p.pointTypeId===STOP_TYPES.end) || /^(END)+/.test(p.pointType) )||[])
                .map( (p: Coords)  => { return turf.point([p.lat, p.lon], {id: p.id, name: p.name });} )
            );
        if ( !( stops.features?.length > 0) ){
            stops = null;
        }

        
        
        track.points.forEach( ( p: any, n: number ) => {
            p.n = n;
            p.ab = false;
            p.type = "point";
            p.firstOverspeed = false;
            p.speed = parseInt(p.speed);
            p.dir = prev.dir;
            p.direction = CMapUtils.direction(p.heading);
            if (p.speed > CMapUtils.SPEED_LIMIT) {
                p.status = 'OVERSPEEDING';
            }
            if (p.status === 'OVERSPEEDING') {
                if (n === 0) {
                    p.firstOverspeed = true;
                    p.overspeed = p.speed;
                } else if (n > 0 && track.points[n-1].status !== 'OVERSPEEDING') {
                    p.firstOverspeed = true;
                    p.overspeed = p.speed;
                }
            }
            
            if ( stops && ( n > 0 ) ){
                let nearest = turf.nearestPoint(turf.point([p.lat, p.lon]), stops);
                if ( nearest ){
                    p.stopId = nearest.properties.id;
                    p.distance = CMapUtils.distance({
                            lat: nearest.geometry.coordinates[0], 
                            lon: nearest.geometry.coordinates[1]
                        }, 
                        p
                    );
                    if ( ( p.distance < 20 ) && (p.stopId !== prev.stopId) ){
                        p.dir++;
                        prev = p;
                    }
                }
            }

            // Настройка отображения стрелок под Zoom
            if( p.status == 'MOVING' ) {
                if(n % 20 == 0) {
                    p.zoom = 10;
                } else if(n % 15 == 0) {
                    p.zoom = 12;
                } else if(n % 10 == 0) {
                    p.zoom = 14;
                } else {
                    p.zoom = 16;
                }
            }
        });
        
        if ( track.points.length > 2 ){
            track.points[0].ab = 1;
            track.points[track.points.length - 1].ab = 2;
        }
        
    };   //normalizeTrack
    
    static direction(heading: Number): String {
        if (typeof heading === "undefined"){
            return "";
        }
        const _DIRS = {
            "c-в": {a1: 10,  a2: 80},
            "вос.":   {a1: 80,  a2: 100},
            "ю-в": {a1: 100, a2: 170},
            "юг":   {a1: 170, a2: 190},
            "ю-з": {a1: 190, a2: 260},
            "зап.":   {a1: 260, a2: 350}
        };
        let res = "сев.";
        Object.keys( _DIRS ).forEach( k => {
            const d: Object = _DIRS[k];
            if ( (heading >= d.a1) && (heading < d.a2) ){
                res = k;
            }
        });
        return res;
    };
    
    /** 
    * Point`s distance in meters
    */
    static distance(ll1: Coords, ll2: Coords ): Number {
        const R = 6372795; // радиус Земли

        if (
          (!ll1)
          || (!ll2)
          || !(!!ll1.lat)
          || !(!!ll2.lat)
        ) {
          return R;
        }
        let from = turf.point([ll1.lon, ll1.lat]),
            to   = turf.point([ll2.lon, ll2.lat]);
        return turf.distance(from, to, {units: 'kilometers'})*1000;

    };   //distance

    static colorFromInt(color: any, alpha = 1): String {
        if ( (color)&&(typeof color === 'object') ) {
            return `rgba(${color.r},${color.g},${color.b},${alpha})`;
        }
        
        let red  = 255,
            green= 0,
            blue = 0;
        try {
            blue  = color & 255;
            green = (color >> 8) & 255;
            red   = (color >> 16) & 255;
        } catch(e){
            console.log('BAD color', color, e);
        }

        return `rgba(${red},${green},${blue},${alpha})`;
    };  //colorFromInt
    
    static colorToInt(color: string){
        let rgb = parseColor(color);
        return  (rgb.a << 24) | ((rgb.r & 255) << 16) | ((rgb.g & 255) << 8) | (rgb.b & 255);
    };
    
    /**
    * Return nearest point index on Line
    */
    static bindPoint(point: Coords, line: any): Number{
        const snapped = turf.nearestPointOnLine(line, [point.lon, point.lat]);
        return <Number> snapped.properties.index;
    };  //
    
    /**
    * Returning WellKnownText (WKT) format from coordinates
    * @param {geozone} geometry
    * @returns {String}
    */
    static toWkt(geozone: any): string {
        let s: string = '', 
         geom: any = null;
        switch (geozone.geotype){
            case 'CIRCLE':
                let pt = geozone.points.at(0);
                geom = new Point([pt.lon||pt.lng, pt.lat]);
                break;
            case 'LINE': 
                geom = new LineString(geozone.points.map( (pt: any) => {
                    return [pt.lon||pt.lng, pt.lat];
                }));
                break;
            case 'POLYGON':
                geom = new Polygon([geozone.points.at(0)?.map( (pt: any) => {
                    return [pt.lon||pt.lng, pt.lat];
                })]);
                break;
        }
        if ( geom ){
            const wkt = new WKT();
            s = wkt.writeGeometry(geom);
        }
        console.log('wkt', s);
        return s;
    }   //toWkt
};      //CMapUtils

export interface IMapProvider {
    name: String;
    _map: Object;
    _node: DOMNode;
    key?: String;
    get node(): Object;
    get zoom(): Number;
    set zoom(val: Number);
    get center(): Coords;
    set center(val: Coords);
    /**
    *   @param {Object} args: {node, center}
    */
    init(args: Object): Promise;
    clean(id?: String): void;
    drawRoutes(routes: Array): void;
    drawVehicles(vehicles: Array): void;
    
    /**
    *    @param {Object} vehicle
    *    @param {Object} opts: {movePointer: false, fitBounds: true}
    */
    drawTrack(vehicle: Object, opts?: Object): void;
    /**
    * One-point in track
    */
    drawTrackPoint(vehicle?: Object): void;
    drawOneStop(stop: Object): void;
    selectVehicles(vehicles: Array): void;
    routeFitBounds(route: Object): void;
    vehiclesFitBounds(): void;
    drawParking(parking?: Object): void;
    drawGeozone(gz: Object): void;
    setCenter(coords: Object, selFeatures?: Boolean): void;
    select(val: Object): void;
    nearests(e: Object): void;
    updateSize(): void;
    getPixels(coords: Coords): any;
    oneCtrlClick(callback: Function): void;
    drawHotPoint(coords: Coords, vehicle: any): void;
    destroy(): void;
    static register(): void;
}   //IMapProvider 
