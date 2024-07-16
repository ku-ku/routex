<template>
    <v-container fluid class="rtx-main__map">
        <v-menu width="480">
            <template v-slot:activator="{ props }">
                <v-fab icon="mdi-menu"
                       absolute
                       app
                       variant="elevated"
                       location="start top"
                       v-bind="props"></v-fab>
            </template>
            <rtx-nav />
        </v-menu>    
        <div id="map"></div>
    </v-container>
</template>
<script>
import { settings } from "jet-ext/composables/settings";
import { empty } from "jet-ext/utils";
import { mapSettings } from "~/composables/map";

import { OlMapProvider } from "~/utils/map/OlMapProvider";
import RtxNav from "~/components/RtxNav";
    
let map = null;

export default {
    name: 'indexPage',
    components: {
        RtxNav
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
        
        return {
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
        }  //initMap
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