import { ref, reactive } from "vue";
import { get as getBranding } from "jet-ext/composables/branding";
import { settings, save as saveSettings } from "jet-ext/composables/settings";
import { empty } from "jet-ext/utils";
import { MapData } from "./map-data";

export const _MAP_PROVIDERS = [];

export const mapSettings = reactive({
    /**
     * implements of IMapProvider
     */
    providers: _MAP_PROVIDERS,
    /**
     * Selected map-provider
     */
    provider: null,
    /**
     * Center on the map: [lon,lat]
     */
    center: null,
    /**
     * search|choose value 
     * @type String (searching) | Object(searched)
     */
    search: null,
    /**
     * map-selected object`s 
     * (watch-array [{type, id,...})
     */
    selected: {
        items: [],
        at: 0,  //for watching
        select: item => {
            if (!item.type){
                console.log("undefined type", item);
            }
            let n = mapSettings.selected.items.findIndex( i => i.type === item.type );
            if ( n > -1 ){
                mapSettings.selected.items.splice(n, 1);
            }
            mapSettings.selected.items.push(item);
            mapSettings.selected.at = (new Date()).getTime();
        },
        clean: id => {
            if ( empty(id) ){
                mapSettings.selected.items = [];
            } else {
                let n = mapSettings.selected.items.findIndex( i => i.id === id );
                if ( n > -1 ){
                    mapSettings.selected.items.splice(n, 1);
                }
            }
            mapSettings.selected.at = (new Date()).getTime();
        }
    },

    save(){
        if (mapSettings.provider){
            saveSettings({"map-provider": mapSettings.provider.id});
        }
    }
});

/**
 * 
 * @param {Object} provider {id, title, component: IMapProvider}
 * @returns {void}
 */
export const regiMapProvider = provider => {
    console.log('reg-map', provider);
    
    let n = _MAP_PROVIDERS.findIndex( p => p.id === provider.id );
    if ( n < 0 ){
        _MAP_PROVIDERS.push(provider);
    }

    
    //set a first registered provider(default)
    if (
            (!mapSettings.provider )
         && (!provider.disabled)
        ){
        mapSettings.provider = provider;
    }
    
    if ( ( settings.local ) && (settings.local["map-provider"]) ){
        const saved = settings.local["map-provider"];
        n = _MAP_PROVIDERS.findIndex( p => p.id === saved );
        if (
                ( n > -1 )
             && (!_MAP_PROVIDERS[n].disabled)
            ){
            mapSettings.provider = _MAP_PROVIDERS[n];
        }
    }
    
    
    //check a center, TOOD:
    if (!mapSettings.center){
        let lon = getBranding("brand.map.lon"),
            lat = getBranding("brand.map.lat");
        if ( lon ) {
            mapSettings.center = [lon, lat];
        } else {
            mapSettings.center = [38.97603, 45.04484]; //TODO: 
        }
    }
};

