declare const $app: any;
declare const $moment: any;

const VERSIO_VIEW_ID = "4929e2c7-eb18-44cc-aa69-15e6dd79660c";  //trSchedules
const STOPS_VIEW_ID  = "7eff8f4d-78e0-4fc6-a7d0-988670172033";  //trScheduleStops
import { END_STOP_TYPE } from "./stops";

import { empty } from "jet-ext/utils";
import { MapType, Direction} from "./types";
import type { MapRoute, MapPoint, MapRouteVersion } from "./types";

export type RtxVersion = {
    id: string,
    regDt: any,
    routeID: string,
    stateID: string,
    stateIDName: string,
    versionNum: number
}

export type RtxStop = {
    id:      string,
    arrTime: string | any,
    depTime: string | any,
    stopTime: number,
    distance?:number,
    pointID: string,
    name:    string,
    tripNum: number,
    ended:   boolean
}

export type RtxTrip = {
    n: number,
    trip: number,
    stops: Array<RtxStop>,
    openedAt?: any,
    closedAt?: any,
    time?: number,
    distance?:number
}

export async function versions(routeId: string): Promise<RtxVersion[]>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ VERSIO_VIEW_ID }?filter=eq(field(".routeId"), param("${ routeId }", "id"))`
    });
    data.forEach( (d: any) => {
        d.regDt = $moment(d.regDt);
    });
    
    //DESC sorting
    return data.sort( (v1:RtxVersion, v2:RtxVersion) => {
        return v1.regDt.isBefore(v2.regDt) ? 1 : -1;
    } );
}

export async function stops(sheId: string): Promise<RtxStop[]>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ STOPS_VIEW_ID }?filter=eq(field(".scheduleId"), param("${ sheId }", "id"))&sort=.depTime`
    });
    
    console.log('stops', data);
    
    data.forEach( (d: any) => {
        d.arrTime = $moment(d.arrTime);
        d.depTime = $moment(d.depTime);
        d.stopTime= d.depTime.diff(d.arrTime, 'minutes');
        d.name    = d.pointIDlocationIDlocName;
        d.ended   = (END_STOP_TYPE===d.pointIDtypeID);
    });
    
    return data;
}


export async function trips(sheId: string): Promise<RtxTrip[]>{
    let _stops: Array<RtxStop> = await stops(sheId);
    let _trips: Array<RtxTrip> = [... new Set(_stops.map( (s: RtxStop) => s.tripNum))].map( (trip: number, n: number) => {
                return {
                    n,
                    trip,
                    stops: _stops.filter( (s: RtxStop) => s.tripNum === trip).sort( (s1: RtxStop, s2: RtxStop) => {
                        return s1.depTime.isBefore(s2.depTime) ? -1 : 1;
                    })
                };
    }).sort( (t1: RtxTrip, t2: RtxTrip) => { return (t1.trip < t2.trip) ? -1 : 1 });
    
    _trips.forEach( (t: RtxTrip, n: number) => {
        t.n = n;
        t.openedAt = $moment([9999, 1, 1]);
        t.closedAt = $moment([0, 1, 1]);
        t.stops.forEach( (s: RtxStop) => {
            if ( t.openedAt.isAfter( s.depTime ) ){
                t.openedAt = s.depTime.clone();
            }
            if ( t.closedAt.isBefore( s.arrTime ) ){
                t.closedAt = s.arrTime.clone();
            }
        } );
        t.time = t.closedAt.diff(t.openedAt, 'minutes');
    } );
    
    return _trips;
};
            
