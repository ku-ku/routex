<template>
    <rtx-dialog :title="title"
                v-model="show"
                :loading="pending"
                v-on:save="save"
                :width="720">
        <v-form ref="form" v-if="stop">
            <v-row>
                <v-col cols="4">
                    <rtx-time label="время прибытия"
                              required
                              v-model="stop.arrTime"
                              v-on:update:modelValue="ontime"></rtx-time>
                </v-col>
                <v-col cols="4">
                    <rtx-time label="время отправления"
                              required
                              v-model="stop.depTime"
                              v-on:update:modelValue="ontime"></rtx-time>
                </v-col>
                <v-col cols="4">
                    <v-text-field label="стоянка (мин.)"
                                 density="compact"
                                 hide-details
                                 readonly
                                 v-model="stop.stopTime" />
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12">
                    <v-autocomplete label="остановка"
                                    density="compact"
                                    :items="stops"
                                    item-title="name"
                                    item-value="id"
                                    v-model="stop"></v-autocomplete>
                </v-col>
            </v-row>
        </v-form>
    </rtx-dialog>    
</template>
<script setup lang="ts">
    import RtxDialog from "~/components/RtxDialog";
    import RtxTime from "~/components/form/RtxTime";
    import { MapType } from "~/services/types";
    import { default as all } from "~/composables/all";
    
    const route = computed(()=>all.routes.active);
    
    const show   = ref(null),
          pending= ref(false),
          stop   = ref(null),
          title  = computed(()=>{
              return `<i class="mdi mdi-bus-stop"></i>&nbsp;${ route.value?.code }. ${route.value?.name}<div class="text-muted">остановка расписания</div>`
          }),
          stops  = computed(()=>{
                if (route.value?.points?.length > 0){
                    return route.value.points.filter( p => p.type === MapType.stop );
                } 
                return [];
          });
  
    function open($stop){
        console.log('open stop', $stop);
        stop.value = { ...$stop };
        ontime();
        show.value = true;
    }
    
    function ontime(){
        if ( (stop.value?.depTime)&&(stop.value?.arrTime)){
            stop.value.stopTime = $moment(stop.value.depTime).diff(stop.value.arrTime, 'minutes');
        } else {
            stop.value.stopTime = null;
        }
    }
    
    
    defineExpose({ open });
    
    async function save(){
        
    }
</script>
<style lang="scss">
    .v-toolbar{
        &-title{
            flex: 1 1 100%;
        }
    }
</style>