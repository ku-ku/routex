import { ref, computed } from "vue";
import { mapSettings } from "./map";
import { routeInfo, routePoints, routeVehicles } from "~/services/routes";
import { carrier as getCarrier, carrierRoutes } from "~/services/carriers";
import { stopInfo, stopRoutes } from "~/services/stops";
import { audit } from "~/services/core";

export const MD_KNOWN_TYPES = {
    "carrier": {title: "Перевозчик", icon: "mdi-account-cowboy-hat-outline"},
    "point":   {title: "Точка маршрута", icon: "mdi-adjust"},
    "route":   {title: "Маршрут", icon: "mdi-highway"},
    "stop":    {title: "Остановка", icon: "mdi-map-marker-radius-outline"},
    "vehicle": {title: "ТС", icon: "mdi-bus"},
    "parking": {title: "Стоянка", icon: "mdi-parking"},
    "geozone": {title: "Геозона", icon: "mdi-circle-outline"}
};

export const MapData = {
    /**
     * key-value map object's (routes, stops,...)
     * add`s fields: 
     *       type(route|stop|vehicle)
     *       loaded: fully loaded item (for stop, vehicle)
     */
    loaded: {},
    
    _use(item){
        MapData.loaded[item.id] = item;
    },
    
    /**
     * Gea a route information
     * @param {uuid} id routeId
     * @param {Boolean} quiet no rejecting
     * @param {Boolean} only  no additionals load
     * @returns {Promise}
     */
    async getroute( id, quiet = false, only = false ){
        return new Promise(async (resolve, reject) => {
            let route = MapData.loaded[id];
            if ( route?.loaded ){
                console.log('route already loaded', route);
                resolve(route);
                return;
            }
            try {
                let res = await routeInfo(id, true);
                if ( ( res )&&(res.length > 0) ){
                    route = res[0];
                    route.type = "route";
                    if (route.route){
                        route.id = route.route;
                    }
                    if (route.routeName){
                        route.name = route.routeName;
                    } else if (route.routerouteName){
                        route.name = route.routerouteName;
                    }
                    if (route.routeCode){
                        route.code = route.routeCode;
                    }  else if ( route.routerouteCode ){
                        route.code = route.routerouteCode;
                    }
                    if ( !only ){
                        route.points = await routePoints(route.id);
                        route.loaded = true;
                    }
                    objAudit(route.id).then( audit => {
                        console.log('audit', audit);
                        route.audit = audit.at(0);
                    }).catch(e => {
                        console.log('ERR (audit)', e);
                    });
                    MapData._use( route );
                    resolve(route);
                } else {
                    if (quiet){
                        resolve({id: id});
                    } else {
                        reject({message: 'No data found for route id: ' + id});
                    }
                }
            } catch(e){
                reject(e);
            }
        });
    },  //getroute
    
    /**
     * Batch load vehicle last telemery
     * @param {Array} vehicles
     * @returns {Promise}
     */
    async lastvcinfos( vehicles ){
        return new Promise( (resolve, reject) => {
            const promises = [];
            let ids = [];
            vehicles.forEach( vc => {
                MapData.loaded[vc.id] = vc;
                if (ids.length > 9){
                    promises.push( lastEvents(ids) );
                    ids = [];
                }
                ids.push(vc);
            });
            if (ids.length > 0){
                promises.push( lastEvents(ids) );
            }
            Promise.all(promises).then( () => {
                resolve();
            }).catch( e => {
                reject(e);
            });
        });
    },  //lastvcinfos
    
    async getroutevehicles( route ){
        return new Promise(async (resolve, reject) => {
            if ( route.modify ){    //don`t loading with modified route
                reject({message: 'Don`t load with editing'});
                return;
            }
            
            let vehicles;
            
            if ( !(route.vehicles?.length > 0) ){
                try {
                    vehicles = await routeVehicles(route.id);
                    vehicles.forEach( vehicle => {
                        vehicleInfo.normalize(vehicle);
                        vehicle.route = route;
                    });
                } catch(e){
                    reject(e);
                    return;
                }
            }
            if (vehicles){
                MapData.lastvcinfos(vehicles).then(()=>{
                    route.vehicles = vehicles.sort( (v1, v2)=>{
                        if ( !v1.telemetry ){
                            return 1;
                        }
                        if ( !v2.telemetry ){
                            return -1;
                        }
                        let h1 = v1.telemetry.state?.state ?? 9999999,
                            h2 = v2.telemetry.state?.state ?? 9999999;
                        return ( h1 === h2 ) ? 0 : ( h1 > h2 ) ? 1 : -1;
                    } );
                    resolve();
                }).catch( e => {
                    reject(e);
                });
            } else {
                resolve();
            }
        });
    },   //getroutevehicles
    
    async getroutecontrol( route ){
        return await routeControl(route);
    },
    
    async getcarrier( id ){
        return new Promise( async (resolve, reject) => {
            let carrier = MapData.loaded[id];
            if (!carrier){
                carrier = getCarrier(id);
                MapData._use(carrier);
            }
            resolve(carrier);
        });
    },  //getcarrier
    
    async getcarrieroutes(carrier){
        return new Promise( async (resolve, reject) => {
            try {
                const routes = await carrierRoutes(carrier.id, true);
                if (routes?.length > 0){
                    const all = [];
                    routes.forEach( r => {
                        r.id = r.route; //switch id from serviced-route
                        all.push(MapData.getroute(r.id));
                    });
                    Promise.all(all).then( res => {
                        resolve(routes);
                    }).catch(e => {
                        reject(e);
                    });
                }
            } catch(e){
                reject(e);
            }
        });
    },  //getcarrieroutes
    
    /**
     * load vehicles & last-info
     */
    async getcarrievehicles(carrier){
        return new Promise( async (resolve, reject) => {
            try {
                let vehicles;
                if ( !(carrier.vehicles?.length > 0) ){
                    vehicles = await carrierVehicles(carrier.id, true);
                    vehicles.forEach( vehicle => vehicleInfo.normalize(vehicle) );
                }
                
                if (vehicles){
                    MapData.lastvcinfos(vehicles).then(()=>{
                        carrier.vehicles = vehicles.sort( (v1, v2)=>{
                            if ( !v1.telemetry ){
                                return 1;
                            }
                            if ( !v2.telemetry ){
                                return -1;
                            }
                            let h1 = v1.telemetry.state?.state ?? 9999999,
                                h2 = v2.telemetry.state?.state ?? 9999999;
                            return ( h1 === h2 ) ? 0 : ( h1 > h2 ) ? 1 : -1;
                        } );
                        
                        resolve();
                    }).catch( e => {
                        reject(e);
                    });
                } else {
                    resolve();
                }
            } catch(e){
                reject(e);
            }
        });
    },  //getcarrievehicles

    async getstop( id ){
        return new Promise(async (resolve, reject)=>{
            try {
                let stop = MapData.loaded[id];
                if (!stop){
                    let res = await stopInfo( id, true );
                    if ( res?.length > 0 ){
                        stop = res[0];
                        stop = Object.assign(stop, {
                            type: "stop",
                            code: stop.Code,
                            name: stop.locName,
                            short: stopInfo.short(stop.locName),
                            lat:  stop.latitude,
                            lon:  stop.longitude
                        });
                        MapData._use( stop );
                    } else {
                        throw {message: 'Bad stop id: ' + id};
                    }
                }
                resolve(stop);
            } catch(e){
                reject(e);
            }
        });
    },  //getstop

    /**
     * Get vehicle info & last-telemetry
     * @param { id } id
     */
    async getvehicle( id ){
        return new Promise(async (resolve, reject)=>{
            try {
                let vehicle = MapData.loaded[id];
                if ( !(vehicle?.loaded) ){
                    let res = await vehicleInfo( id, true );
                    if ( res?.length > 0 ){
                        vehicle = res[0];
                        vehicleInfo.normalize(vehicle);
                        MapData._use(vehicle);
                    } else {
                        throw {message: 'Bad vehicle id: ' + id};
                    }
                }
                await lastEvents([vehicle]);
                vehicle.loaded = true;
                resolve(vehicle);
            } catch(e){
                reject(e);
            }
        });
    },  //getcarrievehicles
    
    async getstoproutes( id ){
        return new Promise(async (resolve, reject)=>{
            try {
                const routes = await stopRoutes(id, true);
                if (routes?.length > 0){
                    Promise.all( routes.map( r => MapData.getroute( r.id, true )) );
                }
                resolve(routes);
            } catch(e){
                reject(e);
            }
        });
    },  //getstoproutes
    
    async getrack( vehicle, period ){
        return track(vehicle, period);
    },  //getrack
    
    async getparking( id ){
        return new Promise(async (resolve, reject)=>{
            try {
                let parking = MapData.loaded[id];
                if (
                        (!parking)
                     || (!parking.loaded)
                   ){
                    parking = await getParking( id );
                    let vehicles = await parkingVehicles(id);
                    parking.vehicles = vehicles.map( vehicle => {
                        vehicleInfo.normalize(vehicle);
                        MapData._use(vehicle);
                        return vehicle;
                    });
                    MapData.lastvcinfos(parking.vehicles);
                    parking.loaded = true;
                    MapData._use(parking);
                }
                resolve(parking);
            } catch(e){
                reject(e);
            }
        });
    },  //getparking
    
    async getgeozone( id ){
        return new Promise(async (resolve, reject)=>{
            try {
                let gz = MapData.loaded[id];
                if ( !gz?.loaded ){
                    gz = await getGeozone( id );
                    if (gz){
                        gz.loaded = true;
                        MapData._use(gz);
                    }
                }
                resolve( gz );
            } catch(e){
                reject(e);
            }
        });
    },  //getgeozone
    
    async rmgeozone( id ){
        let res = await geozoneDel(id);
        if (res.result){
            MapData.loaded[id] = undefined;
        }
        return res;
    },
    /** 
     * get by id
     * download full-info if need
     */
    async get( id ){
        let p, item = MapData.loaded[id];
        if (!item){
            return null;
        }
        if (!item.loaded){
            switch(item.type){
                case "vehicle":
                    p = vehicleInfo( id, true );
                    break;
                case "stop":
                    p = stopInfo( id, true );
                    break;
            }
            if ( p ){
                const res = await p;
                if (res?.length > 0){
                    Object.keys(res[0]).forEach( k => {
                        if (res[0][k]){
                            item[k] = res[0][k];
                        }
                    });
                    item.loaded = true;
                    MapData.loaded[id] = item;
                }
            }
        }
        return item;
    }   //get
    
};
