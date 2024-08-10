<template>
    <v-toolbar density="compact" app>
        <v-btn tile icon="mdi-chevron-left"
               v-on:click="back" />
        <v-divider vertical />
        <div class="rt-route__name text-truncate">
            {{ route?.name }}
        </div>    
        <v-menu>
            <template v-slot:activator="{ props }">
                <v-btn tile
                       class="rt-version"
                       v-bind="props"
                       :loading="pending">
                    <template v-if="version">
                        v.{{ version.versionNum }} {{ version.stateIDName }}
                        <div class="text-muted">
                            {{ format(version.startDt) }}
                        </div>
                    </template>
                    <template>
                        новая версия расписания...
                    </template>    
                </v-btn>
            </template>
            <v-list v-model="version"
                    density="compact"
                    class="rt-versions">
                <v-list-item v-for="v in versions"
                             :value="v"
                             v-on:click="selVersion(v)">
                    <template v-slot:prepend>
                        {{ v.versionNum }}
                        <div class="text-muted">
                            {{ format(v.startDt) }}
                        </div>
                    </template>
                    {{ v.stateIDName }}
                    <div class="rt-versions__meta">
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
</template>
<script setup lang="ts">
    import { default as all, getroutes } from "~/composables/all";
    import { versions as sheVersions, stops as sheStops } from "~/services/shedule";
    
    definePageMeta({
        name: "shedulePage",
        title: "Расписание"
    });
    
    const route = computed({
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

    const { data: stops } = useAsyncData("she-stops", async ()=>{
        if ( !version.value ){
            return [];
        }
        try {
            let _stops = await sheStops(version.value.id);
            console.log('stops', _stops);
            return _stops;
        } catch(e){
            console.log('ERR(stops', e);
            $app.msg({
                text: `Ошибка запроса списка остановок: <div class="small">${ e.message } ${ e.data || ''}</div>`,
                color: 'warning'
            });
        }
    });
    
    function selVersion(v: any){
        version.value = v;
        refreshNuxtData("she-stops");
    }
        
    function format(d: Date){
        return $moment(d).format('DD.MM.YYYY');
    }
    
    function back(){
        useRouter().go(-1);
    }
</script>
<style lang="scss">
    .v-toolbar{
        & .rt-route__name{
            max-width: 30rem;
            margin: 0 1rem;
        }
        & .rt-version.v-btn{
            & .v-btn__content{
                flex-direction: column;
            }
        }
    }
    .rt-versions.v-list{
        & .v-list-item__prepend{
            flex-direction: column;
            margin-right: 1rem;
        }
        & .rt-versions__meta{
            font-size: 0.75rem;
            text-transform: lowercase;
            display: flex;
            flex: 1 1 100%;
            justify-content: space-between;
        }
    }
    
</style>