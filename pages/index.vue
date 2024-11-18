<template>
    <v-container fluid class="rtx-main__map">
        <v-menu width="480">
            <template v-slot:activator="{ props }">
                <v-fab :icon="has('user') ? 'mdi-menu' : 'mdi-account-cancel'"
                       absolute
                       app
                       variant="elevated"
                       location="start top"
                       v-bind="props"></v-fab>
            </template>
            <rtx-nav />
        </v-menu>
        <rtx-searcher v-if="has('user')" />
        <rtx-map-pane v-if="route" 
                      v-on:stop="onstop" 
                      v-on:change="onchange" />
        <div id="map"></div>
    </v-container>
</template>
<script>
import { settings } from "jet-ext/composables/settings";
import { get as getProfile }  from "jet-ext/composables/profile";
import { empty } from "jet-ext/utils";
import { mapSettings } from "~/composables/map";
import { default as all, getroutepoints } from "~/composables/all";

import { OlMapProvider } from "~/utils/map/OlMapProvider";
import RtxNav from "~/components/RtxNav";
import RtxMapPane from "~/components/RtxMapPane";

    
let map = null;

export default {
    name: 'indexPage',
    components: {
        RtxNav,
        RtxMapPane
    },
    setup(){
        if ( settings.local && (settings.local["map-provider"]) ){
            let n = mapSettings.providers.findIndex( p => p.id === settings.local["map-provider"] );
            if (
                    ( n > -1 )
                 && (!mapSettings.providers[n].disabled)
               ){
                mapSettings.provider = mapSettings.providers[n];
            }
        }
        
        const route = computed(()=>{
            return all.routes.active;
        });
        
        return {
            route
        };
    },
    data(){
        return {
            ready: false
        };
    },
    computed: {
        drawer: {
                    get: ()=>{
                        return all.drawer;
                    },
                    set: val=>{
                        all.drawer = val;
                    }
        }
    },
    mounted(){
        this.$nextTick( this.initMap );
    },
    beforeDestroy(){
        try {
            map?.destroy();
        }catch(e){}
    },
    methods: {
        has(q){
            switch(q){
                case "user":
                    return getProfile("has-subject");
            }
            return false;
        },
        initMap(){
            if (map){
                map.destroy();
            };
            
            let provider = mapSettings.provider;
            if ( !provider ){
                $app.msg({text:'Карты не загружены, пожалуйста обновите страницу ( F5 )', type: 'warning'});
                return;
            }
            const node = this.$el.querySelector("#map");
            
            map = new provider.component();
            map.init({ node, center: mapSettings.center }).then(()=>{
                this.ready = true;
            });
        },  //initMap
        async drawRoute(){
            map.clean();
            if ( !this.route ){
                return;
            }
            this.route.modify = true;
            if ( !(this.route.points?.length > 0) ){
                try {
                    await getroutepoints(this.route);
                } catch(e){
                    $app.msg({text:`Ошибка загрузки трассы маршрута:<div class="small">${ e.message } ${ e.data || ''}</div>`, color: 'warning'});
                }
            }
            map.drawRoutes( [this.route] );
        },
        onstop(stop){
            if (stop){
                map.center = stop;
            }
        },
        onchange(){
            map.clean();
            map.drawRoutes( [this.route] );
        }
    },
    watch: {
        route(val){
            console.log('route', val);
            this.drawRoute();
        }
    }
}
</script>
<style lang="scss">
    .rtx-main{
        &__map{
            padding: 0;
            height: 100% !important;
            #map{
                width: 100%;
                height: 100%;
                & .ol-viewport{
                    & .ol-zoom{
                        left: unset;
                        right: 0.5em;
                    }
                }
            }
        }
    }
</style>