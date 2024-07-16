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
export async function routes(): Promise<MapRoute>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ ROUTES_VIEW_ID }`
    });
    return ((data) ? data.map( (d: any) => {
        _normalize( d );
        return d;
    }) : []).sort( (r1: MapRoute, r2: MapRoute) => (r1.num < r2.num) ? -1 : 1);
}


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
    
    return data;
}

export function routeVehicles(){
}
