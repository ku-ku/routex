<template>
    <div class="rtx-searcher">
        <v-menu v-model="show"
                attach
                min-width="480">
            <template v-slot:activator="{ props }">
                <jet-search-input hide-details light 
                                  color="default"
                                  v-on:search = "search($event)" />
            </template>
            <v-list density="compact">
                <v-list-item v-for="d in searched"
                             v-on:click="use(d)">
                    <template v-slot:prepend>
                        {{ d.code }}
                    </template>
                    <template v-slot:title>
                        {{ d.name }}
                    </template>
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
</template>
<script setup lang="ts">
    import { empty } from "jet-ext/utils";
    import JetSearchInput from "jet-ext/components/JetSearchInput";
    import type { MapObject } from "~/services/types";
    import { getroutes } from "~/composables/all";

    const show: Ref<boolean> = ref(false),
          searched: Ref<Array>=ref([]);
    
    useAsyncData('rtx-routes', () => {
        getroutes().catch(e => {
            console.log('ERR (routes)', e);
            $app.msg({
                        text:`Ошибка загрузки списка маршрутов:<div class="small">${ e.message } ${ e.data || ''}.</div>Пожалуйста обновите страницу ( F5 )`, 
                        color: 'warning'
            });
        });
    });
    
    
    function search(s){
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
    
    
    function use(item: MapObject){
        all.routes.active = item;
        show.value = false;
    }
    
</script>
<style lang="scss">
    .rtx-searcher{
        background: rgba(255, 255, 255, .85);
        box-shadow: 0 2px 6px rgba(0, 0, 0, .18);
        padding: 0.25rem;
        border-radius: 4px;
        position: absolute;
        left: 78px;
        top:  16px;
        z-index: 3;
        min-width: 20rem;
        & .h-search{
            width: calc(100% - 1rem);
            margin-right: 0;
        }
        & .v-list{
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
</style>