<template>
    <rtx-dialog :title="title"
                v-model="show"
                :loading="pending"
                v-on:save="calcu"
                :width="720">
        <v-form ref="form" v-if="trip">
            <v-row class="mt-5">
                <v-col cols="4">
                    <rtx-time label="время открытия движения"
                              required
                              v-model="trip.openedAt"></rtx-time>
                </v-col>
                <v-col cols="8">
                    <v-autocomplete label="начальная остановка рейса"
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
    import { MapType } from "~/services/types";
    import type { RtxTrip, RtxStop } from "~/services/shedule";
    import { default as all } from "~/composables/all";

    import RtxDialog from "~/components/RtxDialog";
    import RtxTime from "~/components/form/RtxTime";
        
    const route = computed(()=>all.routes.active);
    
    const $emit = defineEmits(["calcu"]);
    
    const show:    Ref<boolean> = ref(false),
          pending: Ref<boolean> = ref(false),
          trip:    Ref<RtxTrip|null> = ref(null),
          stops:   Ref<RtxStop[]>  = computed(()=>{
                if (route.value?.points?.length > 0){
                    return route.value.points.filter( p => p.type === MapType.stop );
                } 
                return [];
          }),
          stop:   Ref<RtxStop|null> = ref(null);
    
    
    const title = computed(()=>{
        if ( trip.value ){
            return `<i class="mdi mdi-bus-clock"></i>&nbsp;${ route.value.code }. ${ route.value.name }: 
                        ${trip.value.trip}
                    <div class="text-muted">пересчет рейса</div>`;
        }
        return '';
    });
    
    
    
    function open($trip: RtxTrip){
        console.log('open trip', $trip);
        trip.value = {...$trip};
        stop.value = stops.value?.at(0);
        show.value = true;
    }
    
    async function calcu(){
        pending.value = true;
        try {
            let d = $moment(trip.value.openedAt);
            d.add("minute", -(new Date()).getTimezoneOffset());
            const data = await $app.rpc({
                                type: "query",
                                transform: true,
                                query: `1685b20c-f9e1-4994-b704-2e2547e44d91.trPrepareTrip`,
                                params: {
                                    in_route: route.value.id,
                                    in_point: stop.value.id,
                                    in_time:  d.toISOString()
                                }
            });
            console.log('calcu', data);
            trip.value.openedAt = $moment([9999, 1, 1]);
            trip.value.closedAt = $moment([0, 1, 1]);
            trip.value.distance = 0;
            
            trip.value.stops = data.map( (d: any, i: number) => {
                let $stop, stop, n = route.value.points.findIndex( p => p.id === d.pointid );
                $stop = ( n > -1 ) ? route.value.points.at(n) : null;
                trip.value.distance += d.distance||0;
                if ( $stop ){
                    stop = Object.assign($stop, {
                        arrTime: $moment(d.arrtime),
                        depTime: $moment(d.deptime)
                    });
                    stop.stopTime= stop.depTime.diff(stop.arrTime, 'minutes');
                    
                    if ( trip.value.openedAt.isAfter( stop.depTime ) ){
                        trip.value.openedAt = stop.depTime.clone();
                    }
                    if ( trip.value.closedAt.isBefore( stop.arrTime ) ){
                        trip.value.closedAt = stop.arrTime.clone();
                    }
                    return stop;
                }
            });
            trip.value.time = trip.value.closedAt.diff(trip.value.openedAt, 'minutes');
            trip.value.distance=Number(trip.value.distance).toFixed(2);
            $emit('calcu', trip.value);
            setTimeout(()=>{
                show.value = false;
            }, 1000);
        } catch(e){
            console.log('ERR(calcu)', e);
            $app.msg({text: `Ошибка пересчета рейса: ${ e.message }<br /> <small>${ e.data || ''}</small>`,
                     color: "warning"});
        } finally {
            pending.value = false;
        }
    }
    
    defineExpose({ open });
    
    
    
</script>