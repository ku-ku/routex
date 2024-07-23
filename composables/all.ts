import { reactive } from "vue";
import type { MapRoute } from "~/services/types";
import { routes, routeVersions, routePoints, saveRoute, delRoute } from "~/services/routes";

const all = reactive({
    routes: {
        items: [] as MapRoute[],
        active: null as null|MapRoute,
    }
});

export default all;

export async function getroutes(): Promise<MapRoute[]>{
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

export async function saveroute( $route: MapRoute ): Promise<MapRoute>{
    let route: MapRoute = await saveRoute($route);
    
    let n = all.routes.items.findIndex( (r: MapRoute) => r.id === route.id );
    
    if ( n < 0 ){
        all.routes.items.splice(0, 0, route);
    } else {
        all.routes.items.splice(n, 1, route);
    }
    
    return route;
}

export async function delroute( route: MapRoute ): Promise<void> {
    let res = await delRoute(route);
    if ( res ) {
        let n = all.routes.items.findIndex( (r: MapRoute) => r.id === route.id );
        if ( n > -1 ){
            all.routes.items.splice(n, 1);
        }
    }
}