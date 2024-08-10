import { empty } from "jet-ext/utils";

import type * as tr from "./types";

declare const $app: any;
declare const $moment: any;

export const LOCATION_VIEW_ID = "304ad358-2fc8-4402-8de3-1d37bd77fff4"; //trLocations
export const POINT_VIEW_ID    = "91e8c86a-d42e-441d-9d59-c8a2f60ffc20"; //trRoutePoints

export const END_STOP_TYPE = "bd78259f-7b66-ad44-e040-007f02002b0e";


export async function pointInfo(id: string): Promise<tr.MapPoint>{
    const res:Array<any> = await $app.rpc({
                                    type: 'core-read',
                                    transform: true,
                                    query: `sin2:/v:${ POINT_VIEW_ID }?filter=eq(field(".id"),param("${ id }","id")`
                                });
    const point = res.at(0);
    if ( point ){
        point.name = point.locName;
        point.lat  = point.Lat;
        point.lon  = point.Lon;
        point.code = point.Code;
        point.ended= point.typeID === END_STOP_TYPE;
    }
    
    return point;
};  //pointInfo

export async function stopInfo(id: string): Promise<tr.MapPoint>{
    const res:Array<any> = await $app.rpc({
                                    type: 'core-read',
                                    transform: true,
                                    query: `sin2:/v:${ LOCATION_VIEW_ID }?filter=eq(field(".id"),param("${ id }","id")`
                                });
    const stop = res.at(0);
    if ( stop ){
        stop.name = stop.locName;
        stop.lat  = stop.Lat;
        stop.lon  = stop.Lon;
        stop.code = stop.Code;
        stop.ended= stop.typeID === END_STOP_TYPE;
    }
    
    return stop;
};  //stopInfo

export function stopRoutes(){}

export async function savePoint(point: tr.MapPoint){
    const rpc = {
                    type: "core-update",
                    query: `sin2:/v:${ POINT_VIEW_ID }`,
                    params: [
                                {id: "Lat",     type: "float",  value: point.lat},
                                {id: "Lon",     type: "float",  value: point.lon},
                                {id: "locationID", type: "id",  value: point.locationID},
                                {id: "routeID", type: "id",     value: point.routeID},
                                {id: "typeID",  type: "id",     value: point.typeID},
                                {id: "pointNumber", type: "integer", value: point.index},
                                {id: "isStop",  type: "boolean", value: !!point.locationID}
                    ]
                };
    
    let id: string = "";
    
    if ( empty(point.id) ){
        rpc.type = "core-create";
    } else {
        rpc.params.push({id: "id", type: "id", value: point.id});
        id = point.id;
    }
    let res = await $app.rpc(rpc);
    if (res.error){
        throw res.error;
    }
    
    if ( empty(id) ){
        id = res.result[POINT_VIEW_ID];
    }
    
    return await pointInfo(id);
}

export async function saveStop(stop: tr.MapPoint){
    const rpc = {
                    type: "core-update",
                    query: `sin2:/v:${ LOCATION_VIEW_ID }`,
                    params: [
                                {id: "Code",    type: "integer", value: stop.code},
                                {id: "locName", type: "string", value: stop.name},
                                {id: "description", type: "string", value: stop.description},
                                {id: "Lat",     type: "float",  value: stop.lat},
                                {id: "Lon",     type: "float",  value: stop.lon},
                                {id: "twnID",   type: "id",     value: stop.twnID},
                                {id: "startDt", type: "date",   value: stop.startDt},
                                {id: "endDt", type: "date",     value: stop.endDt ? stop.endDt : null},
                    ]
                };
    
    let id: string = "";
    
    if ( empty(stop.id) ){
        rpc.type = "core-create";
    } else {
        rpc.params.push({id: "id", type: "id", value: stop.id});
        id = stop.id;
    }
    let res = await $app.rpc(rpc);
    if (res.error){
        throw res.error;
    }
    
    if ( empty(id) ){
        id = res.result[LOCATION_VIEW_ID];
    }
    
    return await stopInfo(id);
}