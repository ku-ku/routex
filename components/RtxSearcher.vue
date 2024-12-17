<template>
    <div :class="{'rtx-searcher': true, 'position-absolute': props.absolute, 'elevation-3': !props.flat}">
        <v-menu v-model="show"
                min-width="640"
                content-class="rtx-searcher__nav">
            <template v-slot:activator="{ props }">
                <jet-search-input hide-details light 
                                  color="default"
                                  v-on:search = "search($event)" 
                                  v-bind="props" />
            </template>
            <v-list density="compact">
                <template v-if="(searched?.length > 0)">
                    <v-list-item v-for="d in searched"
                                 v-on:click="use(d)">
                        <template v-slot:prepend>
                            {{ d.code }}
                        </template>
                        <template v-slot:title>
                            {{ d.name }}
                        </template>
                    </v-list-item>
                </template>          
                <template v-else>
                    <v-list-item title="введите несколько символов для поиска маршрута"></v-list-item>
                </template>
            </v-list>
        </v-menu>
    </div>
</template>
<script setup lang="ts">
    import { ref, onMounted } from "vue";
    import { settings, save as saveSettings } from "jet-ext/composables/settings";
    import { empty } from "jet-ext/utils";
    import JetSearchInput from "jet-ext/components/JetSearchInput";
    import type { MapObject } from "~/services/types";
    import { getroutes, getroutepoints } from "~/composables/all";

    const props = withDefaults(defineProps<{
                absolute:boolean, 
                flat: boolean
            }>(), {
                absolute: true,
                flat: false
          });
          
    const show: Ref<boolean> = ref(false),
          searched: Ref<Array>=ref([]);
    
    useAsyncData('rtx-routes', ()=>{
        getroutes().then(()=>{
                if ( !empty(settings.local?.lastRoute) ){
                    searched.value = all.routes.items.filter( (r: MapObject)=> (r.id === settings.local.lastRoute) );
                    console.log('using last route', settings.local.lastRoute, searched, all.routes);
                    if ( searched.value.length > 0 ){
                        all.routes.active = searched.value.at(0);
                        show.value = false;
                    }
                }
            }).catch(e => {
                console.log('ERR (routes)', e);
                $app.msg({
                            text:`Ошибка загрузки списка маршрутов:<div class="small">${ e.message } ${ e.data || ''}.</div>Пожалуйста обновите страницу ( F5 )`, 
                            color: 'warning'
                });
            });
    });
    
    
    function search(s: string){
        show.value = false;
        if ( empty(s) ){
            searched.value = [];
        } else {
            searched.value = all.routes.items?.filter( (r: MapObject) =>{
                if (r.code?.indexOf( s ) > -1){
                    return true;
                }
                return r.name.toLowerCase().indexOf( s.toLowerCase() ) > -1;
            });
            if ( searched.value.length < 1 ){
                $app.msg({
                            text:`ВНИМАНИЕ! По запросу "<b>${ s }</b>" ничего не найдено.<br />Пожалуйста измените условие поиска`, 
                            location: 'top',
                            color: 'default'
                        });
            }
        }
        show.value = (searched.value.length > 0);
    };  //search
    
    async function use(item: MapObject){
        all.routes.active = item;
        saveSettings({lastRoute: item.id});
        show.value = false;
        if ( !(item.points?.length > 0) ){
            await getroutepoints(item);
        }
        navigateTo({path:"/cartography", query: {id: item.id}});
    }
    
</script>
<style lang="scss">
    .rtx-searcher{
        background: rgba(255, 255, 255, .85);
        padding: 0.25rem;
        border-radius: 4px;
        left: 78px;
        top:  16px;
        z-index: 3;
        min-width: 20rem;
        & .h-search{
            width: calc(100% - 1rem);
            margin-right: 0;
        }
        &__nav{
            .v-list {
                &-item{
                    &__prepend{
                        margin-right: 1rem;
                    }
                    &:not(:last-child){
                        border-bottom: 1px solid #ccc;
                    }
                }
            }
        }
    }
</style>