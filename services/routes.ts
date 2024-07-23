declare const $app: any;
declare const $moment: any;

const ROUTES_VIEW_ID = "63cb4030-8bd7-40c5-820e-e7613769a8cc";
const VERSIO_VIEW_ID = "6a910f42-4f28-4c25-8960-ca1190541bd5";
const POINTS_VIEW_ID = "91e8c86a-d42e-441d-9d59-c8a2f60ffc20";

import { empty } from "jet-ext/utils";
import { MapType } from "./types";
import type { MapRoute, MapRouteVersion } from "./types";


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
            d.dt  = $moment(d.regDt).toDate();
            d.code= d.versionNum ? Number( (''+d.versionNum).replace(_re_num, '')) : 999;
        } );
    }
    return data;
} 

export async function routePoints(routeId: string, verId?: string){
    let query = `sin2:/v:${ POINTS_VIEW_ID }?filter=eq(field(".routeId"), param("${ routeId }", "id"))`;
    if ( !empty(verId) ){
        query = `sin2:/v:${ POINTS_VIEW_ID }?filter=and(eq(field(".routeId"), param("${ routeId }", "id")), eq(field(".versionId"), param("${ verId }", "id"))`;
    }
    
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query
    });
    
    data.forEach( (d: any) => {
        d.lat = d.Lat;
        d.lon = d.Lon;
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
}