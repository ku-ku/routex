//35012029
import { profile } from 'jet-ext/composables/profile';
import { uuidv4 } from 'jet-ext/utils';

let token = reactive({});

export const model = reactive({
    state: {
        counts: {
            all  : null,
            added: null
        },
        error: null
    },
    items: [
        {name: 'Маршрутные сети', method: 'sync_types()', use: true},
        {name: 'Маршруты', method: 'sync_routes()', use: true},
        {name: 'Трассы маршрутов', method: 'sync_points()', use: true},
        {name: 'Расписания', method: 'sync_schedules()', use: true}
    ],
    sync: async () => {
        if ( !token?.token )
            await auth();
        model.items.filter((m) => m.use).forEach(async (m) => {
            m.successed = await eval(m.method);
        });
    },
    clear: () => {
        model.items.forEach((m) => {
            m.use = true;
            m.successed = null;
        });
    }
});

const HOST = 'sync';

const r_types = reactive({
    data: null,
    load: async () => {
        r_types.data = JSON.parse(await $fetch(HOST + '/public_route_networks', {
            method: 'POST',
            body: token
        }));
    },
    get: async (id) => {
        try {
            const obj = await $app.rpc({
                type: 'core-read', 
                query: `sin2:/v:51531684-8c00-4e05-9e53-73edd7c61434?filter=eq(field(".syncID"), param(${id}, "integer"))`
            });
            return obj.result.data[0][obj.result.columnIndexes['trroutetypes.id']];
        } catch(e) {
            return null;
        }
    }
});

const routes = reactive({
    data: null,
    load: async () => {
        routes.data = JSON.parse(await $fetch(HOST + '/public_transport_routes', {
            method: 'POST',
            body: token
        }));
    },
    get: async (id) => {
        try {
            const obj = await $app.rpc({
                type: 'core-read', 
                query: `sin2:/v:63cb4030-8bd7-40c5-820e-e7613769a8cc?filter=eq(field(".syncID"), param(${id}, "integer"))`
            });
            return obj.result.data[0][obj.result.columnIndexes['trroutes.id']];
        } catch(e) {
            return null;
        }
    }
})

const locations = reactive({
    data: null,
    load: async () => {
        locations.data = [];
        const promises = [];
        routes.data.forEach( (r) => {
            promises.push(
                new Promise(async (resolve, reject) => {
                    const opts = token;
                    opts.route_id = r.id;
                    opts.data = $moment().format("DD.MM.YYYY");
                    const result = JSON.parse(await $fetch(HOST + '/public_transport_stops', {
                        method: 'POST',
                        body: opts
                    }));
                    result.forEach((r) => {
                        locations.data.push(r);    
                    })
                    resolve();
                })
            );
        });
        await Promise.all(promises);
    }
});

const points = reactive({
    data: null,
    load:  async () => {
        points.data = [];
        const promises = [];
        routes.data.forEach( (r) => {
            promises.push(
                new Promise(async (resolve, reject) => {
                    const opts = token;
                    opts.route_id = r.id;
                    opts.data = $moment().format("DD.MM.YYYY");
                    const result = JSON.parse(await $fetch(HOST + '/public_transport_route_shapes', {
                        method: 'POST',
                        body: opts
                    }));
                    var num = 1;
                    const items = [];
                    result.forEach((p) => {
                        p.geometry.coordinates.forEach((c, i, p) => {
                            const lat = c[1], lon = c[0];
                            items.push({
                                num: num,
                                lat: lat,
                                lon: lon,
                                type: (i == 0 || i==(p.length-1)) ? 1 : 0
                            });
                            num = num + 1;
                        });
                    });
                    points.data.push({
                        route: r.id,
                        points: items
                    });
                    resolve();
                })
            );
        });
        await Promise.all(promises);
    }
});

const schedules = reactive({
    data: null,
    load: async () => {
        schedules.data = [];
        const promises = [];
        routes.data.forEach( (r) => {
            promises.push(
                new Promise(async (resolve, reject) => {
                    const opts = token;
                    opts.route_id = r.id;
                    opts.data = $moment().format("DD.MM.YYYY");
                    const result = JSON.parse(await $fetch(HOST + '/public_transport_schedules', {
                        method: 'POST',
                        body: opts
                    }));
                    schedules.data.push({
                        route: r.id,
                        schedules: result
                    });
                    resolve();
                })
            );    
        });
        await Promise.all(promises);
    }
})
const auth = async () => {
    const uri = HOST + '/token/auth';
    token = JSON.parse(await $fetch(uri, {
        method: 'POST',
        body: {
            login: 'API_USER_KRD',
            password: 'VOl1.2.3.vol@147'
        }
    }));
}

const sync_types = async() => {
    try {
        if ( !r_types.data )
            await r_types.load();
        r_types.data.forEach(async (t) => {
            const id = await r_types.get(t.id);
            const opts = {
                type: ( !!id ) ? 'core-update' : 'core-create',
                query: 'sin2:/v:51531684-8c00-4e05-9e53-73edd7c61434',
                params: [
                    {id: 'typeName', type: 'string', value: t.name},
                    {id: 'syncID', type: 'integer', value: t.id},
                    {id: 'startDt', type: 'date', value: $moment().format("YYYY-MM-DD")}
                ]
            }
            if ( !!id )
                opts.params.push({id: 'id', type: 'id', value: id})
            await $app.rpc(opts);
        });
        return true;
    } catch(e) {
        console.log('Err.sync_types', e);
        return false;
    }
};

const sync_routes = async() => {
    try {
        if ( !routes.data ) 
            await routes.load();
        const tenant = profile.tenant.id;
        routes.data.forEach(async (r) => {
            if ( !r.is_blocked ) {
                const id = await routes.get(r.id);
                const opts = {
                    type: ( !!id ) ? 'core-update' : 'core-create',
                    query: 'sin2:/v:63cb4030-8bd7-40c5-820e-e7613769a8cc',
                    params: [
                        {id: 'routeCode', type: 'string', value: r.route_short_name},
                        {id: 'routeName', type: 'string', value: r.route_long_name},
                        {id: 'routeTypeID', type: 'id', value: await r_types.get(r.route_network_id)},
                        {id: 'tenantID', type: 'id', value: tenant},
                        {id: 'syncID', type: 'integer', value: r.id},
                        {id: 'startDt', type: 'date', value: $moment().format("YYYY-MM-DD")}
                    ]
                }
                if ( !!id )
                    opts.params.push({id: 'id', type: 'id', value: id})
                await $app.rpc(opts);                
            }
        });
        return true;
    } catch(e) {
        console.log('Err.sync_routes', e);
        return false;
    }
};
const sync_points = async() => {
    try {
        if ( !routes.data ) 
            await routes.load();
        await locations.load();
        await points.load();

        const opts = {
            type: 'query',
            query: 'dbcb9cc3-dbd8-4bcb-8e37-44cd43d7637e.importLocations',
            params: {
                in_locations: JSON.stringify(locations.data),
            }
        }
        await $app.rpc(opts);

        const promises = [];
        routes.data.forEach((r) => {
            const p = points.data.find((lo) => lo.route == r.id).points;
            if ( p.length > 0 ) {
                promises.push(
                    new Promise(async (resolve, reject) => {
                        const opts = {
                            type: 'query',
                            query: 'dbcb9cc3-dbd8-4bcb-8e37-44cd43d7637e.importRoutePoints',
                            params: {
                                in_route: r.id,
                                in_points: JSON.stringify(p)
                            }
                        }
                        await $app.rpc(opts);
                        resolve();
                    })
                );
            }
        });
        await Promise.all(promises);

        return true;
    } catch(e) {
        console.log('Err.sync_points', e);
        return false;
    }
};

const sync_schedules = async () => {
    try {
        if ( !routes.data ) 
            await routes.load();
        await schedules.load();
        console.log(schedules.data);
        return true;
    } catch(e) {
        console.log('Err.sync_schedules', e);
        return false;
    }   
};