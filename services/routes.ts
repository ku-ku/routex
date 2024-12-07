declare const $app: any;
declare const $moment: any;
declare const $turf: any;

const ROUTES_VIEW_ID = "63cb4030-8bd7-40c5-820e-e7613769a8cc";
const VERSIO_VIEW_ID = "6a910f42-4f28-4c25-8960-ca1190541bd5";
const POINTS_VIEW_ID = "91e8c86a-d42e-441d-9d59-c8a2f60ffc20";
const NMCK_VIEW_ID   = "2d1898bb-6d68-4ed1-a25c-5de5716f403d";  //trContractPrices
const CONTRA_VIEW_ID = 'd2bcf4e0-e996-49b1-9d8f-76aac5a41b4e';  //trContracts

import { empty, uuidv4 } from "jet-ext/utils";
import { MapType, Direction} from "./types";
import type { MapRoute, MapPoint, MapRouteVersion } from "./types";
import { END_STOP_TYPE } from "./stops";
import { profile } from "jet-ext/composables/profile";
import { transform } from "ol/proj";

const _re_num = /[^0-9]+/g;

function _normalize( route: any ): void{
    route.type = MapType.route;
    route.code = route.routeCode;
    route.name = route.routeName;
    route.num  = Number(route.code?.replace(_re_num, ''));
    route.start= $moment(route.startDt).toDate();
    route.end  = (route.endDt) ? $moment(route.endDt).toDate() : null;
}

/**
* read & normalize all routes    
*/
export async function routes(id?: string): Promise<MapRoute[]>{
    const rpc = {
                    type: "core-read",
                    transform: true,
                    query: `sin2:/v:${ ROUTES_VIEW_ID }`
    };
    if ( !empty(id) ){
        rpc.query += `/?id=${ id }`;
    }
    const data = await $app.rpc( rpc );
    
    return ((data) ? data.map( (d: any) => {
            _normalize( d );
            return d;
    }) : []).sort( (r1: MapRoute, r2: MapRoute) => (r1.num < r2.num) ? -1 : 1);
}


export async function routeInfo(routeId: string): Promise<MapRoute>{
};

export async function routeVersions(routeId: string): Promise<MapRouteVersion>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ VERSIO_VIEW_ID }?filter=eq(field(".routeId"), param("${ routeId }", "id"))&sort=-.versionNum`
    });
    if ( data?.length > 0 ){
        data.forEach( (d: any) => {
            d.type= MapType.version;
            d.regdt= $moment(d.regDt).toDate();
            d.code= d.versionNum ? Number( (''+d.versionNum).replace(_re_num, '')) : 999;
            d.name= d.stateIDName;
        } );
    }
    return data.sort( (d1:MapRouteVersion,d2:MapRouteVersion) => {return (d1.code < d2.code) ? 1 : -1;} );  //desc sort
} 

export async function routePoints(routeId: string, verId?: string): Promise<MapPoint[]>{
    let query = `sin2:/v:${ POINTS_VIEW_ID }?filter=eq(field(".routeId"), param("${ routeId }", "id"))`;
    if ( !empty(verId) ){
        query = `sin2:/v:${ POINTS_VIEW_ID }?filter=and(eq(field(".routeId"), param("${ routeId }", "id")), eq(field(".versionId"), param("${ verId }", "id"))`;
    }
    
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query
    });
    
    let prev: MapPoint|null = null;
    
    data.forEach( (d: any) => {
        d.direction = Direction.forward;
        d.distance  = 0;
        d.lat = d.Lat;
        d.lon = d.Lon;
        d.name = d.locationIDlocName;
        d.type = (d.locationID) ? MapType.stop : MapType.point;
        d.ended= END_STOP_TYPE===d.typeID;
        if ( prev ){
            let p1 = $turf.point([prev.lon, prev.lat]),
                p2 = $turf.point([d.lon, d.lat]);
            d.distance = prev.distance + Math.round($turf.distance(p1, p2)*1000);
        }
        prev = d;
    });
    
    return data;
}

export function routeVehicles(){
}

export async function saveRoute(route: MapRoute): Promise<MapRoute>{
    const rpc = {
                    type: "core-update",
                    query: `sin2:/v:${ ROUTES_VIEW_ID }`,
                    params: [
                                {id: "routeCode", type: "string", value: route.code},
                                {id: "routeName", type: "string", value: route.name},
                                {id: "routeTypeID", type: "id",   value: route.routeTypeID},
                                {id: "startDt", type: "date",     value: route.start},
                                {id: "endDt", type: "date",       value: route.end ? route.end : null},
                    ]
                };
    
    let id: string = "";
    
    if ( empty(route.id) ){
        rpc.type = "core-create";
    } else {
        rpc.params.push({id: "id", type: "id", value: route.id});
        id = route.id;
    }
    let res = await $app.rpc(rpc);
    if (res.error){
        throw res.error;
    }
    
    if ( empty(id) ){
        id = res.result[ROUTES_VIEW_ID];
    }
    
    let r = await routes(id);
    return r.at(0);
};  //saveRoute

export async function delRoute(route: MapRoute): Promise<boolean>{
    const rpc = {
                    type: "core-delete",
                    query: `sin2:/v:${ ROUTES_VIEW_ID }?id=${ route.id }`,
                    params: [
                                {id: "id", type: "id", value: route.id}
                            ]
    };
    let res = await $app.rpc(rpc);
    if (res.error){
        throw res.error;
    }
    
    return true;
};

export async function getRouteDetails(route: MapRoute, q: string): Promise<any>{
    const VEIW_IDS = {
        "nmck":   NMCK_VIEW_ID,
        "contra": CONTRA_VIEW_ID
    };
    
    const viewId: string = VEIW_IDS[ q ];
    
    const query = `sin2:/v:${ viewId }?filter=eq(field(".routeId"), param("${ route.id }", "id")`;
    const rpc = {
                    type: "core-read",
                    transform: true,
                    query
    };
    let res = await $app.rpc(rpc);
    
    if (res.error){
        throw res.error;
    }
    return res;
    
};  //getRouteDetails

export async function getRouteDirections(route: string): Promise<any> {
    const rpc = {
        type: 'query',
        transform: true,
        query: 'dbcb9cc3-dbd8-4bcb-8e37-44cd43d7637e.getDirections',
        params: {
            in_routeID: route
        }
    }
    let res = await $app.rpc(rpc);

    if (res.error) {
        throw res.error;
    }
    return res;
}; //getRouteDirections

export async function calcRouteSchedule(route: string, cnt: number, interval: number, directions: any): Promise<any> {
    let result: Array<any> = [];
    let promises: Array<any> = [];
    directions.forEach( (d: any) => {
        var startTm = $moment(`01.01.1900 ${d.starttm}`);
        let i = 1;
        while ( i <= cnt ) {
            const rpc = {
                type: 'query',
                transform: true,
                query: '1685b20c-f9e1-4994-b704-2e2547e44d91.trPrepareTrip',
                params: {
                    in_route: route,
                    in_point: d.id,
                    in_time : startTm.format('YYYY-MM-DD HH:mm')
                }
            };
            ( (v) => {
                promises.push(
                    new Promise( async (resolve, reject) => {
                        const res = await $app.rpc(rpc);
                        if (res.error) {
                            throw res.error;
                        }
                        result.push({
                            num: v,
                            direction: d.id,
                            starttm: $moment(res[0].deptime).format('HH:mm'),
                            endtm  : $moment(res[res.length-1].arrtime).format('HH:mm'),
                            stops: res
                        });
                        resolve(true);
                    })
                )
            })(i);
            startTm = startTm.add(interval, 'minutes');
            i++;
        }
    });
    await Promise.all(promises);
    return result;
}

export async function calcRouteScheduleN(route: string, intervals: any, directions: any): Promise<any> {
    const dt = $moment().format('YYYY-MM-DD');
    let result: Array<any> = [];
    let sch: Array<any> = [];
    let promises: Array<any> = [];
    intervals.value.forEach( (i: any) => {
        i.start = $moment(`${dt} ${i.starttm}`).get('hour')*60 + $moment(`${dt} ${i.starttm}`).get('minute');
        i.end = $moment(`${dt} ${i.endtm}`).get('hour')*60 + $moment(`${dt} ${i.endtm}`).get('minute');
    });
    directions.forEach( (d: any) => {
        const rpc = {
            type: 'query',
            transform: true,
            query: '1685b20c-f9e1-4994-b704-2e2547e44d91.trPrepareTrip',
            params: {
                in_route: route,
                in_point: d.id,
                in_time : `${dt} 00:00`
            }
        };
        promises.push(
            new Promise( async (resolve, reject) => {
                const res = await $app.rpc(rpc);
                if (res.error) {
                    throw res.error;
                }
                res.forEach( (r: any) => {
                    r.start = $moment(`${dt} ${$moment(r.arrtime).format('HH:mm')}`).get('hour')*60 + $moment(`${dt} ${$moment(r.arrtime).format('HH:mm')}`).get('minute');
                    r.end = $moment(`${dt} ${$moment(r.deptime).format('HH:mm')}`).get('hour')*60 + $moment(`${dt} ${$moment(r.deptime).format('HH:mm')}`).get('minute');
                });
                sch.push({
                    direction: d.id,
                    stops: res
                });
                resolve(true);
            })
        );
    });
    await Promise.all(promises);
    directions.forEach( (d: any) => {
        let loading = true,
            interval = null,
            v = 1,
            start = $moment(`${dt} ${d.starttm}`).get('hour')*60 + $moment(`${dt} ${d.starttm}`).get('minute'),
            tmp = sch.find( (f: any) => f.direction == d.id );
        while ( !!loading ) {
            interval = intervals.value.find((i: any) => i.start <= start && i.end >= start);
            if ( !interval ) {            
                loading = false;
            } else {
                const stops: Array<any> = [];
                tmp.stops.forEach( (s: any) => {
                    stops.push({
                        distance: s.distance,
                        pointid: s.pointid,
                        pointname: s.pointname,
                        start: start + s.start,
                        end: start + s.end
                    });
                });
                result.push({
                    num: v,
                    direction: d.id,
                    start: stops[0].start,
                    end  : stops[stops.length-1].end,
                    stops: stops
                });
                start = start + Number(interval.interval);
            }
            v++;
        }    
    });
    return result;
};

export async function saveSchedule(data: any): Promise<any> {
    const tenant = profile.tenant.id;
    const res = await $app.rpc({
        type: 'query',
        query: '8bd2aaab-6189-4242-b425-67d384318782.saveSchedule',
        params: {
            in_tenantID : tenant, 
            in_startDt  : $moment(data.startDt).format('YYYY-MM-DD HH:mm:ss'),
            in_endDt    : $moment(data.endDt).format('YYYY-MM-DD HH:mm:ss'),
            in_routeID  : data.routeID,
            in_intervals: data.intervals,
            in_days     : data.days,
            in_holiday  : data.holiday,
            in_schedules: data.schedules
        }
    });
    if (res.error){
        throw res.error;
    }    
    return res;
};