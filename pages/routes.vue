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
                       to="/" />
            </template>
        </v-tooltip>
        <v-tooltip text="изменить...">
            <template v-slot:activator="{ props }">
                <v-btn tile icon="mdi-pencil"
                       size="small"
                       v-bind="props"
                       to="/" />
            </template>
        </v-tooltip>
        <v-tooltip text="удалить">
            <template v-slot:activator="{ props }">
                <v-btn tile icon="mdi-close"
                       size="small"
                       v-bind="props"
                       to="/" />
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
        <splitpanes class="default-theme" horizontal>
            <pane>
                <v-data-table class="jet-table"
                              ref="table"
                              fixed-header
                              no-filter
                              hover
                              :headers="hdrs"
                              :items="routes"
                              :items-per-page="50"
                              item-value="id"
                              single-select
                              show-select
                              select-strategy="single"
                              no-data-text="..."
                              height="100%"
                              :value-comparator="comparator"
                              return-object
                              v-model="selected"
                              v-on:click:row.stop="select">
                    <template v-slot:item.data-table-select="{ index, item, toggleSelect, isSelected }">
                        {{ $bind(item, toggleSelect) }}
                        <v-icon v-if="isSelected({value:item.id})"
                                :data-item-index="index"
                                :data-item-id="item.id"
                                class="selected">
                            mdi-menu-right
                        </v-icon>
                    </template>
                    <template v-slot:item.start="{ item }">
                        {{ format(item.start) }}
                    </template>
                </v-data-table>
            </pane>
            <pane>
                <div class="rtx-routes__adds">
                    <rtx-route-stops :route="active" />
                </div>    
                <v-tabs bottom density="compact"
                        v-model="tab">
                    <v-tab slim>остановки маршрута</v-tab>
                    <v-tab slim>перевозчики</v-tab>
                </v-tabs>
            </pane>
        </splitpanes>
    </v-container>    
</template>
<script setup lang="ts">
    import { ref, watch } from "vue";
    import 'splitpanes/dist/splitpanes.css';
    import { Splitpanes, Pane } from 'splitpanes';
    import { empty } from "jet-ext/utils";
    import type { MapRoute } from "~/services/types";
    import { default as all, getroutes} from "~/composables/all";
    import JetSearchInput from "jet-ext/components/JetSearchInput";
    import RtxRouteStops from "~/components/RtxRouteStops";
        
    const table= ref(null);
    const hdrs = ref([
            {title: '№', key: 'code'},
            {title: 'Маршрут', key: 'name'},
            {title: 'Тип', key: 'routeTypeIDtypeName'},
            {title: 'Дата нач.', key: 'start'},
            {title: 'Дата оконч.', key: 'end'}
          ]),
          tab = ref(0),
          s   = ref(null);
    
    const routes = computed(()=> {
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
          selected = ref([]),           /* table model */
          active: Ref<MapRoute> = computed(()=>{     /* active route by table model */
                let n, id = selected.value?.at(0);
                if ( !id ){
                    return null;
                }
                n = all.routes.items.findIndex( r => r.id === id );
                return ( n < 0 ) ? null : all.routes.items[n];
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
    
    function comparator(r1, r2): boolean{
        return (r1||'xxx$xxx')===(r2||'xxx#xxx');
    };
    
    function $bind(item, toggleSelect){
        item.toggle = toggleSelect;
        return null;
    };
    
    function format( dt: Date|null): string{
        return ( dt ) ? $moment(dt).format("DD.MM.YYYY") : null;
    };
    
    function has(q: string, v?: any): boolean{
        switch(q){
        }
        return false;
    }   //has
    
    
    function select(e, { item }){
        item.toggle({value:item.id});
    };
    
    watch(error, ()=>{
        if ( error.value ){
            $app.msg({text: `Ошибка получения списка маршрутов: ${ error.value.message }<br /> <small>${ error.value.data || ''}</small>`,
                     color: "warning"});
        }
    });
    
</script>
<style lang="scss" scoped>
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
            height: calc(100% - 48px) !important;
            max-height: calc(100% - 48px) !important;
            padding: 0;
            overflow: hidden;
            & .v-data-table{
                &__tr:has(td .v-icon.selected){
                    $selected:  rgb(var(--v-theme-primary));
                    background: $selected;
                    & > td {
                        background: $selected !important;
                        color: white;
                    }
                }
                &__td {
                    & .v-selection-control{
                        display: none;
                    }
                }
                &__selected{
                    $selected:  rgb(var(--v-theme-primary));
                    background: $selected;
                    & > td {
                        background: $selected !important;
                        color: white;
                    }
                }
            }
        }
        &__adds{
            height: calc(100% - 38px);
            max-height: calc(100% - 38px);
        }
    }
    
</style>