import { MapType } from "./types";
import type { MapObject } from "./types";

declare const $app: any;

const ROUTE_TYPES_VIEW_ID = '51531684-8c00-4e05-9e53-73edd7c61434';

export async function getRouteTypes(): Promise<MapObject>{
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
