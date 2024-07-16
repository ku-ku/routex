<template>
    <v-data-table class="jet-table"
                  ref="table"
                  fixed-header
                  disable-sort
                  no-filter
                  hover
                  height="100%"
                  :headers="hdrs"
                  :items-per-page="-1"
                  item-value="id"
                  :items="stops"
                  :loading="pending"
                  single-select
                  disable-pagination
                  hide-default-footer
                  no-data-text="..."
                  return-object>
    </v-data-table>
</template>
<script setup lang="ts">
    import { ref, toRef, computed, watch } from "vue";
    import { empty } from "jet-ext/utils";
    import type { MapRoute } from "~/services/types";
    import { getroutepoints } from "~/composables/all";
    
    const props = defineProps({
        route: {
            type: Object,
            required: false,
            default: null
        }
    });
    
    const route: Ref<MapRoute> = toRef(props, 'route'),
          stops: Ref<any> = computed(()=>{
              if ( !route.value?.points > 0 ){
                  return [];
              }
              return route.value.points.filter( p => !empty(p.locationID) );
          });

    const table = ref(null),
          hdrs = ref([
            {title: '№', key: 'pointNumber'},
            {title: 'Наименование', key: 'name'},
            {title: 'Ш', key: 'Lat'},
            {title: 'Д', key: 'Lon'}
          ]);
    
    const {data, pending, error} = useAsyncData('rtx-route-stops', async ()=>{
        if ( !empty(route.value?.id) ){
            try {
                await getrouteversions(route.value);
                route.value.version = route.value.versions.at(0);

                await getroutepoints(route.value);
                console.log(`route #${route.value.id} points`, route.value.points);
            } catch(e){
                console.log('ERR (route-points)', e);
                $app.msg({
                            text: `Ошибка получения остановок маршрута:<br /><small>${ e.message } ${ e.data || ''}`,
                            color: 'warning'
                });
            }
        }
    }, {
        watch: [route]
    });
    
</script>