import { reactive } from "vue";
import type { MapRoute } from "~/services/types";
import { routes, routeVersions, routePoints } from "~/services/routes";

const all = reactive({
    routes: {
        items: [],
        active: null,
    }
});

export async function getroutes(): Promise<MapRoute>{
    if ( !( all.routes.items?.length > 0 ) ){
        let res: any = await routes();
        if ( res.error ){
            throw res.error;
        }
        all.routes.items = res;
    }
    return all.routes.items;
};

export async function getrouteversions( route: MapRoute ): Promise<number>{
    let res: any = await routeVersions(route.id);
    if ( res.error ){
        throw res.error;
    }
    route.versions = res;
    return route.versions?.length || -1;
}
export async function getroutepoints( route: MapRoute ): Promise<number>{
    let res: any = await routePoints(route.id, route.version?.id);
    if ( res.error ){
        throw res.error;
    }
    route.points = res;
    return route.points?.length || -1;
};


export default all;