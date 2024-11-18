<template>
    <teleport to="body">
        <rtx-stop-form ref="stopForm" />
        <rtx-route-version ref="routeVersion" />
    </teleport>
    <div class="rtx-map__pane">
        <v-toolbar density="compact" 
                   color="grey-lighten-5"
                   elevation="2"
                   extended>
            <v-toolbar-title>
                {{ route.code }}. {{ route.name }}
            </v-toolbar-title>
            <v-spacer />
            <rtx-route-versions :route="route" 
                                can-add 
                                v-on:newver="newver" />
            <v-btn size="x-small" icon="mdi-close" 
                   v-on:click="close"></v-btn>
            <template v-slot:extension>
                <v-btn size="small"
                       prepend-icon="mdi-plus"
                       variant="text"
                       v-on:click="modifystop(null)">
                    доб.остановку
                </v-btn>
                <v-tooltip text="перестроить трассу маршрута">
                    <template v-slot:activator="{props}">
                        <v-btn v-bind="props"
                               :disabled="(stops?.length||0) < 2"
                               size="small"
                               icon="mdi-vector-polyline"
                               variant="text"
                               v-on:click="rebuild">
                        </v-btn>
                    </template>
                </v-tooltip>
                <v-tooltip text="сбросить трассу маршрута">
                    <template v-slot:activator="{props}">
                        <v-btn :disabled="!(route?.points?.length > 0)"
                               v-bind="props"
                               size="small"
                               icon="mdi-close-circle-outline"
                               variant="text"
                               v-on:click="cleanroute">
                        </v-btn>
                    </template>
                </v-tooltip>
                <v-spacer />
                <v-tooltip text="сохранить изменения">
                    <template v-slot:activator="{props}">
                        <v-btn v-bind="props"
                               size="small"
                               icon="mdi-content-save"
                               variant="text"
                               v-on:click="$emit('saveroute', p)">
                        </v-btn>
                    </template>
                </v-tooltip>
            </template>
        </v-toolbar>
        <v-card tile
                :loading="pending">
            <v-card-text density="compact">
                <draggable v-model="stops"
                           tag="div" 
                           class="v-list v-theme--light v-list--density-default"
                           item-key="index"
                           role="listbox"
                           handle=".drag-handle">
                    <template #item="{element: s}">
                        <v-list-item :key="s.index"
                                     :class="{'route-stop': true, 'end-stop': s.ended}"
                                     :active="s.id === activeStop?.id"
                                     :value="s"
                                     v-on:click="selstop(s)">
                            <template v-slot:prepend>
                                <v-icon size="small" class="drag-handle"
                                        v-on:click.stop.prevent="void">mdi-drag-vertical</v-icon>
                            </template>
                            <div class="route-stop__name">
                                {{ s.name }}
                            </div>
                            <div class="route-stop__meta">
                                <v-icon size="small">
                                    {{s.ended ? 'mdi-bus-stop' : (s.direction === Direction.forward) ? 'mdi-arrow-right-bold-circle-outline' : 'mdi-arrow-left-bold-circle-outline'}}
                                </v-icon>
                                &nbsp;{{ Number(s.lon).toFixed(5) }} / {{ Number(s.lat).toFixed(5) }}
                                <template v-if="s.distance">
                                    &nbsp;( {{ s.distance > 1000 ? Number(s.distance/1000).toFixed(2) + 'km' : s.distance + 'm'}} )
                                </template>
                            </div>
                            <template v-slot:append>
                                <v-menu>
                                    <template v-slot:activator="{props}">
                                        <v-btn size="x-small"
                                               flat
                                               v-bind="props"
                                               icon="mdi-dots-vertical"></v-btn>
                                    </template>
                                    <v-list density="compact"
                                            nav>
                                        <v-list-item title="изменить..."
                                                     prepend-icon="mdi-map-marker-right-outline"
                                                     v-on:click="modifystop(s)">
                                        </v-list-item>
                                        <v-list-item :title="s.ended ? 'конечная' : 'остановка'"
                                                     :subtitle="s.ended ? 'изменить на остановку' : 'изменить на конечную'"
                                                     :prepend-icon="s.ended ? 'mdi-bus-stop' : 'mdi-bus-stop-uncovered'"
                                                     v-on:click="changestoptype(s)">
                                        </v-list-item>
                                        <v-divider />
                                        <v-list-item title="открыть расписание..."
                                                     prepend-icon="mdi-calendar-month-outline"
                                                     v-on:click="shedulestop(s)">
                                        </v-list-item>
                                        <v-divider />
                                        <v-list-item title="удалить"
                                                     prepend-icon="mdi-map-marker-remove-outline"
                                                     v-on:click="delstop(s)"></v-list-item>
                                    </v-list>
                                </v-menu>
                            </template>
                        </v-list-item>
                    </template>
                </draggable>
            </v-card-text>
            <v-toolbar class="rtx-map__footer"
                       density="compact" 
                       color="grey-lighten-5"
                       elevation="0">
                <v-toolbar-title>
                    <b>Shift+Click</b>-новая точка маршрута | <b>Ctrl+Click</b>-удалить
                </v-toolbar-title>
            </v-toolbar>
        </v-card>
    </div>
</template>
<script setup lang="ts">
    import { computed, ref, unref, toRef, reactive } from 'vue';
    import draggable from "vuedraggable";
    
    import { MapType, Direction} from "~/services/types";
    import type { MapRoute, MapStop } from "~/services/types";
    
    import { default as all } from "~/composables/all";
        
    import RtxStopForm from "~/components/route/RtxStopForm";
    import RtxRouteVersions from "~/components/route/RtxRouteVersions";
    import RtxRouteVersion from "~/components/route/RtxRouteVersion";
        
    const $emit = defineEmits<{
        (e: 'stop', stop: MapStop): void,
        (e: 'change'): void
    }>()
    
    const pending = ref(false);
    
    const stopForm: Ref<RtxStopForm> = ref(null),
          routeVersion: Ref<RtxRouteVersion> = ref(null);
          
    const route : Ref<MapRoute> = computed(()=>{
        return all.routes.active;
    });
    
    const stops : Ref<array<MapStop>> = computed({
        get: ()=>{
            if ( route.value?.points?.length > 0 ){
                return route.value.points.filter( p => p.type === MapType.stop );
            } 
            return [];
        },
        set (val: array<MapStop>){
            route.value.points = val;
            $emit("change");
        }
    }); //stops
    
    
    const activeStop: Ref<MapStop> = ref(null);
    
    function modifystop(stop: MapStop|null): void {
        stopForm.value.open(stop);
    };  //modifystop
    
    function changestoptype(stop: MapStop): void{
        activeStop.value = stop;
        stop.ended = !stop.ended;
    };  //changestoptype
    
    function delstop(stop: MapStop): void{
        $app.msg({
            text: `Для подтвержения удаления остановки "${ stop.name }" нажмите "Ok"`,
            color: "primary",
            location: "top",
            timeout: 60000,
            click: (ok: boolean) => {
                if ( ok ){
                    let n = route.value.points.findIndex( p => p.id === stop.id );
                    if ( n > -1 ){
                        route.value.points.splice(n, 1);
                        $emit("change");
                    }
                }
            }
        });
        
    };  //delstop
    
    function selstop(stop: MapStop): void{
        activeStop.value = stop;
        $emit("stop", stop);
    };  //selstop
        
        
    function onmapoint(e: Event): void{
        switch ( e.data.action ){
            case "add":
                break;
            default:
                if (MapType.stop === e.data.item.type){
                    activeStop.value = e.data.item;
                }
        }
    }
    document.addEventListener('mapoint', onmapoint);
    
    async function rebuild(): void{
        if (stops.value.length < 2){
            $app.msg({text: 'Для построения трассы необходимо не менее 2-х остановок', color: 'warning'});
            return;
        }
            
        const all : array<Promise> = [];
        pending.value = true;
        stops.value.forEach( async (s, n) => {
            if ( n === 0 ){
                return;
            }
            all.push(new Promise( async (resolve, reject) => {
                try {
                    const prev = stops.value.at(n - 1);
                    /**
                     * TODO: (?)
                     * At: http://project-osrm.org/docs/v5.24.0/api/?language=cURL#route-service
                     * proxied to http://router.project-osrm.org/route/v1/route/
                     */
                    const url = `http://router.project-osrm.org/route/v1/route/${ prev.lon },${ prev.lat };${ s.lon },${ s.lat }?overview=full&geometries=geojson`;
                    const res = await $.ajax({ 
                        url,
                        crossDomain: true
                    });
                    let geom = res.routes.at(0)?.geometry;
                    if ( !(geom?.coordinates?.length > 0) ){
                        resolve();
                        return;
                    }
                    geom = $turf.simplify(geom, {tolerance: 0.0001, highQuality: false});
                    s.line = [];
                    geom.coordinates.forEach( c => { 
                        s.line.push({
                            lon: c[0],
                            lat: c[1], 
                            type: MapType.point
                        });
                    });
                    resolve();
                } catch(e){
                    console.log('ERR (buildroute)', e);
                    reject(e);
                }
            }) );
        });
        
        try {
            await Promise.all(all);

            const points = [];

            stops.value.forEach( (s, n) => {
                if (
                        ( n === 0 )
                    || !( s.line?.length > 0)
                   ) {
                   points.push(s);
                   return;
                }
                points.push(...s.line);
                delete s.line;
                points[points.length - 1] = s;
            });

            let now = (new Date()).getTime();
            points.forEach( (p, n) => {
                now++;
                p.id = '' + now;
                p.index = n;
                p.stop = (!!p.location) || (MapType.stop === p.type);
                p.type = p.stop ? MapType.stop : MapType.point;
            });

            route.value.points = points;
            $emit("change");
            $app.msg({
                text: `Трасса маршрута "${ route.value.code }. ${ route.value.name }" 
                       перестроена: ${ points.length }&nbsp;точек, ${ stops.value.length }&nbsp;остановок`,
                color: "info",
                location: "top"
            })
        } catch(e){
            $app.msg({
                text: `Ошибка перестроения трассы маршрута:<div class="small">${ e.message }</div>`,
                color: 'warning'
            });
        } finally {
            pending.value = false;
        }
    }   //rebuild
    
    function cleanroute(): void {
        $app.msg({
            text: `Для подтвержения сброса трассы маршрута нажмите "Ok"<div class="small mt-2">(будут удалены все остановки и точки маршрута)</div>`,
            color: "primary",
            location: "top",
            timeout: 60000,
            click: ok => {
                if ( ok ){
                    route.value.points = [];
                    $emit("change");
                }
            }
        });
    }   //cleanroute
    
    function newver(){
        routeVersion.value.open(route.value);
    }
    
    function shedulestop(stop: MapStop){
        activeStop.value = stop;
        navigateTo({name: "shedulePage", query: {id: route.value.id}});
    }
    
    function close():void{
        all.routes.active = null;
    }
    
</script>
<style lang="scss">
    .rtx-map {
        &__pane{
            position: absolute;
            z-index: 2;
            left: 1rem;
            top: 5rem;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0, .33);
            & .v-toolbar{
                max-width: 540px;
                &-title{
                    font-size: 0.9rem;
                    font-weight: 600;
                    flex: 1 1 auto;
                }
                &__extension{
                    padding-left: 0.5rem;
                    border-bottom: 1px solid #ccc;
                }
            }
            & .v-card {
                &-text{
                    height: 100vh;
                    max-height: 720px;
                    overflow-y: auto;
                }
            }
            & .v-list{
                & .v-list-item{
                    &:not(:last-child){
                        border-bottom: 1px solid #ccc;
                    }
                }
            }
        }
        &__footer{
            &.v-toolbar {
                height: fit-content !important;
                font-size: 0.7rem;
                & .v-toolbar__content{
                    height: fit-content !important;
                }
                & .v-toolbar-title{
                    font-size: 0.7rem !important;
                    font-weight: 400;
                }
            }
        }
    }
</style>