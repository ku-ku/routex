import { MapType } from "./types";
import type { MapObject } from "./types";

declare const $app: any;

const ROUTE_TYPES_VIEW_ID = '51531684-8c00-4e05-9e53-73edd7c61434';
const POINT_TYPES_VIEW_ID = '4da874c6-6f68-4ed0-b0ab-7ff6ae494fba';

const VEHICLE_CLASSES_VIEW_ID = 'cbed80d0-ca6d-461c-8747-7f868ba7d559';
const FUEL_KINDS_VIEW_ID = '68f21e57-242d-452a-a51c-036a44e34ee6';


export async function getRouteTypes(): Promise<Array<MapObject>>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ ROUTE_TYPES_VIEW_ID }?sort=.typeName`
    });
    if ( data?.length > 0 ){
        data.forEach( (d: any) => {
            d.type= MapType.reference;
            d.name= d.typeName;
            d.code= d.typeCode;
        } );
    }
    return data;
}

export async function getPointTypes(): Promise<Array<MapObject>>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ POINT_TYPES_VIEW_ID }?filter=and(
                                    lte(field(".startDt"),var("util.date.truncToDay(dateEnd)")),
                                    or(
                                            isnull(field(".endDt")),gte(field(".endDt"),var("util.date.truncToDay(dateBegin)"))
                                    )
                                &sort=.nodeTypeName`
    });
    if ( data?.length > 0 ){
        data.forEach( (d: any) => {
            d.type= MapType.reference;
            d.name= d.nodeTypeName;
        } );
    }
    return data;
}

export async function getVehicleClasses(): Promise<Array<any>>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ VEHICLE_CLASSES_VIEW_ID }`
    });
    
    return data;
};  //getVehicleClasses

export async function getFuelKinds(): Promise<Array<any>>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ FUEL_KINDS_VIEW_ID }`
    });
    
    return data;
};  //getFuelKinds
