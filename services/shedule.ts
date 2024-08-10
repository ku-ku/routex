declare const $app: any;
declare const $moment: any;

const VERSIO_VIEW_ID = "4929e2c7-eb18-44cc-aa69-15e6dd79660c";  //trSchedules
const STOPS_VIEW_ID  = "7eff8f4d-78e0-4fc6-a7d0-988670172033";  //trScheduleStops

import { empty } from "jet-ext/utils";
import { MapType, Direction} from "./types";
import type { MapRoute, MapPoint, MapRouteVersion } from "./types";


export async function versions(routeId: string): Promise<any[]>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ VERSIO_VIEW_ID }?filter=eq(field(".routeId"), param("${ routeId }", "id"))&sort=-.versionNum`
    });
    
    return data;
}

export async function stops(sheId: string): Promise<any[]>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ STOPS_VIEW_ID }?filter=eq(field(".scheduleId"), param("${ sheId }", "id"))`
    });
    
    return data;
}
