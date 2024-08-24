<template>
    <v-toolbar density="compact" app>
        <v-btn tile icon="mdi-chevron-left"
               v-on:click="back" />
        <v-divider vertical />
        <v-menu>
            <template v-slot:activator="{ props }">
                <v-btn tile icon="mdi-cog-outline"
                       v-bind="props"></v-btn>
            </template>
            <v-list>
                <v-list-item prepend-icon="mdi-plus">
                    Добавить рейс...
                </v-list-item>
                <v-divider />
                <v-list-item prepend-icon="mdi-calendar-sync">
                    Пересчитать расписание...
                </v-list-item>
                <v-list-item prepend-icon="mdi-content-copy">
                    Копировать версию расписания
                </v-list-item>
                <v-list-item prepend-icon="mdi-close">
                    Удалить версию расписания
                </v-list-item>
            </v-list>
        </v-menu>    
        <v-divider vertical />
        <div class="rxt-route__name text-truncate" v-if="route">
            {{ route.code }}.&nbsp;{{ route.name }}
        </div>    
        <v-menu>
            <template v-slot:activator="{ props }">
                <v-btn tile
                       class="rxt-version"
                       v-bind="props"
                       :loading="pending">
                    <template v-if="version">
                        {{ version.versionNum }} {{ version.stateIDName }} ({{ format(version.startDt) }})
                        <div class="text-muted">
                            {{ version.seasonIDname }} | {{ version.modeIDmodName }}
                        </div>
                    </template>
                    <template>
                        новая версия расписания...
                    </template>
                </v-btn>
            </template>
            <v-list v-model="version"
                    density="compact"
                    class="rxt-versions">
                <v-list-item v-for="v in versions"
                             :value="v"
                             v-bind:class="{approval: /^(утв)/gi.test(v.stateIDName)}"
                             v-on:click="selVersion(v)">
                    <template v-slot:prepend>
                        {{ v.versionNum }}
                        <div class="text-muted">
                            {{ format(v.startDt) }}
                        </div>
                    </template>
                    {{ v.stateIDName }}
                    <div class="rxt-versions__meta">
                        {{ v.seasonIDname }} | {{ v.modeIDmodName }}
                    </div>
                </v-list-item>
                <v-divider />
                <v-list-item>
                    новая версия расписания...
                </v-list-item>
            </v-list>
        </v-menu>
    </v-toolbar>
    <v-container fluid
                 class="rtx-shedule">
        <rtx-she-trip v-for="t in trips"
                      :trip="t"
                      v-on:click="onstop"
                      v-on:recalc="ontripcalc(t)">
        </rtx-she-trip>
    </v-container>
    <teleport to="body">
        <rtx-she-stop ref="shestop"></rtx-she-stop>
        <rtx-trip-calc ref="tripcalc"
                       v-on:calcu="oncalcu"></rtx-trip-calc>
    </teleport>
</template>
<script setup lang="ts">
    import { default as all, getroutes } from "~/composables/all";
    import { versions as sheVersions, trips as sheTrips } from "~/services/shedule";
    import type { RtxTrip } from "~/services/shedule";
    import type { MapRoute, MapStop } from "~/services/types";
    
    import RtxSheTrip from "~/components/shedule/RtxSheTrip";
    import RtxSheStop from "~/components/shedule/RtxSheStop";
    import RtxTripCalc from "~/components/shedule/RtxTripCalc";
    
    definePageMeta({
        name: "shedulePage",
        title: "Расписание"
    });
    
    const shestop:Ref<RtxSheStop|null> = ref(null),
         tripcalc:Ref<RtxTripCalc|null> = ref(null);
    
    const route: Ref<MapRoute> = computed({
        get: ()=>{
            return all.routes.active;
        },
        set: (val: MapRoute)=>{
            all.routes.active = val;
        }
    });
    
    const version = ref(null);
    
    const { pending, error, data: versions } = useAsyncData("she-version", async ()=>{
        version.value = null;
        if ( !route.value ){
            return [];
        }
        try {
            let vers = await sheVersions(route.value.id);
            console.log('versions', vers);
            selVersion(vers.at(0));
            return vers;
        } catch(e){
            console.log('ERR(stops', e);
            $app.msg({
                text: `Ошибка запроса списка версий расписаний маршрута: <div class="small">${ e.message } ${ e.data || ''}</div>`,
                color: 'warning'
            });
        }
    }, {
        watch: [route]
    });

    const { data: trips } = useAsyncData("she-stops", async ()=>{
        if ( !version.value ){
            return [];
        }
        pending.value = true;
        try {
            let res = await sheTrips(version.value.id);
            console.log('trips', res);
            return res;
        } catch(e){
            console.log('ERR(stops', e);
            $app.msg({
                text: `Ошибка запроса списка остановок: <div class="small">${ e.message } ${ e.data || ''}</div>`,
                color: 'warning'
            });
        } finally {
            pending.value = false;
        }
    });
    
    function selVersion(v: any): void{
        version.value = v;
        refreshNuxtData("she-stops");
    }
        
    function format(d: Date): string{
        return $moment(d).format('DD.MM.YYYY');
    }
    
    function back(){
        useRouter().go(-1);
    }
    
    function onstop(stop: MapStop): void{
        shestop.value.open(stop);
    }
    
    function ontripcalc(trip: RtxTrip): void{
        tripcalc.value.open(trip);
    }   //ontripcalc
    
    function oncalcu(trip: RtxTrip): void{
        let n = trips.value.findIndex( t => t.trip === trip.trip );
        if ( n < 0 ){
            trips.value.push(trip);
        } else {
            trips.value.splice(n, 1, trip);
        }
    }
</script>
<style lang="scss">
    .v-toolbar{
        & .rxt-route__name{
            max-width: 30rem;
            margin: 0 1rem;
        }
        & .rxt-version.v-btn{
            & .v-btn__content{
                flex-direction: column;
            }
            & .text-muted{
                text-transform: lowercase;
            }
        }
    }
    .rxt-versions.v-list{
        & .v-list-item__prepend{
            flex-direction: column;
            margin-right: 1rem;
        }
        & .v-list-item{
            &.approval{
                & .v-list-item__content{
                    font-weight: 600;
                    text-transform: uppercase;
                }
            }
            & .rxt-versions__meta{
                font-size: 0.75rem;
                text-transform: lowercase;
                display: flex;
                flex: 1 1 100%;
                justify-content: space-between;
                font-weight: 400;
                text-transform: lowercase;
            }
        }
    }
    
    .rtx-shedule{
        display: flex;
        overflow: auto;
        & .v-card{
            margin-right: 1rem;
        }
    }
    
</style>