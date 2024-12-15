import { reactive } from "vue";
import type { MapRoute, MapPoint } from "~/services/types";
import { routes, routeVersions, routePoints, saveRoute, delRoute } from "~/services/routes";

declare const $app: any;


const all = reactive({
    /** dashboard indicators */
    indics: null,
    /** all routes */
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
    if ( route.points?.length > 0 ){
        const end:MapPoint = route.points.filter( (p: MapPoint) => p.ended ).at(1);
        route.distance = end ? end.distance : null;
    }
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

export async function getindics(): Promise<any>{
    if (
            ( !all.indics )
          ||(all.indics?.loading)
        ){
        let $indics = await $app.rpc({
                                    type: 'query',
                                    transform: true,
                                    query: 'dbcb9cc3-dbd8-4bcb-8e37-44cd43d7637e.trDashboard'
        });
        if ( $indics.length > 0 ){
            all.indics = JSON.parse($indics[0].trdashboard);
        }
    }
    return all.indics;
}