<template>
    <rtx-dialog :title="title"
                v-model="show"
                :loading="pending"
                v-on:save="save">
        <v-form ref="form">
            <v-row>
                <v-col cols="4">
                    <v-autocomplete :items="versions"
                                    item-title="code"
                                    item-value="id"
                                    v-model="current"
                                    label="скопировать трассу из:">
                        <template v-slot:item="{ item, props }">
                            <v-list-item>
                                <v-row dense>
                                    <v-col cols="3">
                                        {{ item.raw.code }}.
                                    </v-col>
                                    <v-col>
                                        {{ item.raw.name }}
                                        <div class="text-muted">
                                            {{ format(item.raw.regdt) }}
                                        </div>
                                    </v-col>
                                </v-row>
                            </v-list-item>
                        </template>
                    </v-autocomplete>    
                </v-col>
                <v-col cols="4">
                    <v-checkbox label="создать пустую трассу"
                                v-model="empty"></v-checkbox>
                </v-col>
            </v-row>    
            <v-row>
                <v-col cols="4">
                    <jet-input-date v-model="version.regdt"
                                    label="Дата версии"
                                    type="date"
                                    required />
                </v-col>
                <v-col cols="4">
                    <jet-input-number v-model="version.code"                                    
                                      label="Номер версии"
                                      type="integer"
                                      required />
                </v-col>
            </v-row>
        </v-form>
    </rtx-dialog>
</template>
<script setup lang="ts">
    import { ref, computed } from "vue";
    import JetInputNumber from "jet-ext/components/form/editors/JetInputNumber";
    import JetInputDate from "jet-ext/components/form/editors/JetInputDate";
    import { default as all } from "~/composables/all";
    import RtxDialog from "~/components/RtxDialog";
    import type { MapObject, MapRoute } from "~/services/types";
    import { routeVersions } from "~/services/routes";
    
    const _DEFS = {
        id: null,
        regdt: new Date(),
        code: 1
    };
    
    declare const $moment: any;
    
    const show:    Ref<boolean> = ref(false),
          pending: Ref<boolean> = ref(false),
          empty:   Ref<boolean> = ref(false),
          version: Ref<any>  = ref({..._DEFS}),
          versions:Ref<any[]>= ref([]),
          current: Ref<any>  = ref(null);
  
    const route: Ref<MapRoute|null> = ref(null),
          title: Ref<string> = computed(()=>{
                if ( route.value ){
                    return `${route.value.code}. ${route.value.name}<div class="text-muted">новая версия трассы маршрута</div>`;
                } 
                return '';
        });
    
    const { error } = useAsyncData('route-versions', async ()=>{
        current.value = null;
        pending.value = true;
        versions.value = [];
        version.value = { ..._DEFS };
        try {
            const res = await routeVersions(route.value.id);
            if ( res.length > 0 ){
                current.value = res.at(0);
                version.value.code = Number(current.value.code) + 1;
            }
            versions.value = res;
        } finally {
            pending.value = false;
        }
    });
    
    function format(dt: Date|string): string{
        return $moment(dt).format('DD.MM.YYYY');
    }

    function open($route: MapRoute){
        console.log('open ver for', $route);
        route.value = $route;
        refreshNuxtData('route-versions');
        show.value = true;
    };
    
    function save(){
        
    };
        
    defineExpose({ open });
    
</script>

