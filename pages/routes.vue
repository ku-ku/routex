<template>
    <v-toolbar density="compact" app>
        <v-btn tile icon="mdi-chevron-left"
               to="/" />
        <v-divider vertical />
        <v-tooltip text="добавить новый...">
            <template v-slot:activator="{ props }">
                <v-btn tile icon="mdi-plus"
                       size="small"
                       v-bind="props"
                       v-on:click="doroute(true)" />
            </template>
        </v-tooltip>
        <v-tooltip text="изменить...">
            <template v-slot:activator="{ props }">
                <v-btn tile icon="mdi-pencil"
                       size="small"
                       v-bind="props"
                       v-on:click="doroute(false)" />
            </template>
        </v-tooltip>
        <v-tooltip text="удалить">
            <template v-slot:activator="{ props }">
                <v-btn tile icon="mdi-close"
                       size="small"
                       v-bind="props"
                       v-on:click="delroute" />
            </template>
        </v-tooltip>
        <v-divider vertical />
        <v-tooltip text="перейти к расписанию">
            <template v-slot:activator="{ props }">
                <v-btn tile icon="mdi-calendar-month"
                       size="small"
                       v-bind="props"
                       v-on:click="go('shedule')" />
            </template>
        </v-tooltip>
        <v-divider vertical />
        <div style="width:33%">
            <jet-search-input hide-details 
                              light
                              v-on:search = "s = $event" />
        </div>    
        <v-spacer />
        <v-btn tile icon="mdi-reload"
               v-on:click="refresh" />
    </v-toolbar>
    <v-container fluid class="rtx-routes__conte">
        <splitpanes class="default-theme" vertical>
            <pane>
                <v-card :loading="pending"
                        flat
                        rounded="0">
                    <v-card-text>
                        <v-list class="rtx-routes" 
                                v-if="has('routes')"
                                return-object
                                selectable
                                v-model:selected="selected"
                                density="compact"
                                color="primary"
                                variant="elevated">
                            <v-list-item v-for="r in routes" class="rtx-route"
                                         :key="r.id"
                                         :value="r">
                                <template v-slot:prepend>
                                    <div class="rtx-route__num">
                                        {{ r.code }}
                                    </div>
                                    <div class="rtx-route__dt">
                                        {{ format(r.start) }}
                                    </div>    
                                </template>
                                <template v-slot:title>
                                    {{ r.name }}
                                </template>
                                <div class="rtx-route__meta">
                                    {{ r.routeTypeIDtypeName }}
                                </div>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </pane>
            <pane>
                <rtx-route-details :route="active" />
            </pane>
        </splitpanes>
    </v-container>
    <rtx-route-form ref="frmRoute" />
</template>
<script setup lang="ts">
    import { ref, watch } from "vue";
    import 'splitpanes/dist/splitpanes.css';
    import { Splitpanes, Pane } from 'splitpanes';
    import { empty } from "jet-ext/utils";
    import type { MapRoute } from "~/services/types";
    import { default as all, getroutes, delroute as $delroute } from "~/composables/all";
    import JetSearchInput from "jet-ext/components/JetSearchInput";
    import RtxRouteForm from "~/components/route/RtxRouteForm";
    import RtxRouteDetails from "~/components/route/RtxRouteDetails";
        
    const frmRoute = ref(null);
       
    const s = ref(null);
    
    const routes: Ref<MapRoute[]> = computed(()=> {
                if ( empty(s.value) ){
                    return all.routes.items;
                }
                return all.routes.items?.filter( r =>{
                    if (r.code?.indexOf( s.value ) > -1){
                        return true;
                    }
                    return r.name.toLowerCase().indexOf( s.value.toLowerCase() ) > -1;
                });
            }),
          selected: Ref<MapRoute[]> = ref([]),           /* list model */
          active: Ref<MapRoute> = computed(()=>{
              return selected.value.at(0);
          });
    
    const {data, pending, error} = useAsyncData('rtx-routes', async ()=>{
        await getroutes();
        console.log('routes', all.routes.items);
        return all.routes.items?.length > 0;
    });
    
    
    function refresh(): void {
        s.value = null;
        all.routes.items = [];
        refreshNuxtData('rtx-routes');
    };
    
    function format( dt: Date|null): string{
        return ( dt ) ? $moment(dt).format("DD.MM.YYYY") : null;
    };
    
    function has(q: string, v?: any): boolean{
        switch(q){
            case "routes":
                return routes.value.length > 0;
        }
        return false;
    }   //has
    
    
    function onroute(r: MapRoute): void{
        console.log('route', r);
    };
    
    /**
     * Add/edit route
     */
    function doroute(add: boolean){
        frmRoute.value.open(( add ) ? null : {...selected.value});
    };
    
    function delroute(){
        if ( !selected.value ){
            return;
        }
        $app.msg({
                    text: `Удалить выбранный маршрут № ${ selected.value.code }. ${ selected.value.name }?`,
                    location: "top",
                    color: "primary",
                    click_title: "удалить",
                    click: async( ok: any) => { 
                        if ( ok ){
                            try {
                                await $delroute(unref(active));
                            } catch(e){
                                console.log('ERR(del)', e);
                                $app.msg({text: `Ошибка удаления маршрута: ${ e.message }<br /><small>${ e.data || ''}</small>`,
                                         color: "warning"});
                            }
                        }
                    },
                    timeout: 20000
                 });
    };   //
    
    watch(error, ()=>{
        if ( error.value ){
            $app.msg({text: `Ошибка получения списка маршрутов: ${ error.value.message }<br /><small>${ error.value.data || ''}</small>`,
                     color: "warning"});
        }
    });
    
    function go(q: string): void{
        switch(q){
            case "shedule":
                all.routes.active = active.value;
                navigateTo({path:"/shedule", query: {id: active.value.id}});
                break;
        }
    }
    
</script>
<style lang="scss">
    $selected:  rgb(var(--v-theme-primary));
    
    .v-toolbar{
        & .h-search{
            width: 100%;
        }
        & .v-divider {
            margin: 0 0.5rem;
        }
    }
    .rtx-routes{
        &__conte{
            height: calc(100dvh - 80px) !important;
            max-height: calc(100dvh - 80px) !important;
            padding: 0;
            overflow: hidden;
            & .v-card {
                height: 100%;
                & .v-list{
                    &-item{
                        &__prepend{
                            flex-direction: column;
                            margin-right: 0.5rem;
                        }
                        &:not(:last-child){
                            border-bottom: 1px solid #ddd;
                        }
                        .rtx-route{
                            &__num{
                                font-size: 1rem;
                            }
                            &__dt, &__meta{
                                font-size: 0.75rem;
                                color: grey;
                            }
                        }
                        &--active{
                            & .rtx-route__dt,
                            & .rtx-route__meta{
                                color: rgba(255,255,255, 0.75);
                            }
                        }
                    }
                }
            }
        }
        &__adds{
            height: calc(100% - 38px);
            max-height: calc(100% - 38px);
            & .v-table{
                height: 100% !important;
            }
        }
    }
    
</style>