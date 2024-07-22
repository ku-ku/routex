<template>
    <rtx-dialog :title="title"
                v-model="show"
                :loading="pending"
                v-on:save="save">
        <v-form ref="form">
            <v-row dense>
                <v-col cols="4">
                    <v-autocomplete label="Тип маршрута"
                                    density="compact"
                                    :items="routeTypes"
                                    item-title="name"
                                    item-value="id"
                                    v-model="route.routeTypeID"></v-autocomplete>
                </v-col>
            </v-row>    
            <v-row dense>
                <v-col cols="4">
                    <jet-input-date label="Дата начала"
                                    type="date"
                                    v-model="route.start"
                                    required></jet-input-date>
                </v-col>
                <v-col cols="4">
                    <jet-input-date label="Дата окончания"
                                    type="date"
                                    v-model="route.end"></jet-input-date>
                </v-col>
            </v-row>    
            <v-row dense>
                <v-col cols="4">
                    <jet-input-string v-model="route.code"
                                      type="string"
                                      label="№ маршрута"
                                      required />
                </v-col>
                <v-col cols="8">
                    <jet-input-string v-model="route.name"
                                      type="string"
                                      label="Наименование"
                                      required />
                </v-col>
            </v-row>
        </v-form>
    </rtx-dialog>
</template>
<script setup lang="ts">
import { ref, unref, computed } from "vue";
import JetInputString from "jet-ext/components/form/editors/JetInputString";
import JetInputDate from "jet-ext/components/form/editors/JetInputDate";
import { default as all, saveroute } from "~/composables/all";
import RtxDialog from "../RtxDialog";
import type { MapObject, MapRoute } from "~/services/types";
import { getRouteTypes } from "~/services/references";

const dlg = ref(null);

const show: Ref<boolean>           = ref(false),
      pending: Ref<boolean>        = ref(false),
      form: Ref<VForm>             = ref(null),
      route: Ref<MapRoute|null>    = ref(null),
      routeTypes: Ref<MapObject[]> = ref([]);

const title = computed(()=>{
    return route.value ? 'Редактирование' : 'Новый маршрут';
});

useAsyncData('route-types', ()=>{
    if (routeTypes.value.length > 0){
        return;
    }
    getRouteTypes().then( res => {
        console.log('route-types', res);
        routeTypes.value = res;
    }).catch(e => {
        console.log('ERR(route-types)', e);
    });
});

function open($route: MapRoute|null){
    route.value = $route || {
        id:  null,
        num: null,
        name: null,
        routeTypeID: null,
        start: new Date(),
        end: null
    };
    show.value = true;
};

async function save(){
    let ok = await form.value.validate();
    if ( !ok ){
        return;
    }
    
    pending.value = true;
    try {
        await saveroute( unref(route) );
        show.value = false;
    } catch(e){
        console.log('ERR (save)', e);
        $app.msg({text: `Ошибка сохранения изменений: ${ e.message }<br /> <small>${ e.data || ''}</small>`,
                 color: "warning"});
    } finally {
        pending.value = false;
    }
};  //save

defineExpose({
    open
});

</script>