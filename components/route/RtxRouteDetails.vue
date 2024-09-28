<template>
    <v-card :loading="pending" 
            :class="{'rtx-route__total': true, empty: !has('data')}">
        <v-card-title v-if="route">
            <v-row class="justify-between">
                <v-col>
                    <b>НМЦК</b>
                    <template v-if="route">
                        <span class="ml-3">
                            {{ route.code }} {{ route.name }}
                        </span>
                        <div v-if="has('data')" class="text-muted">
                            расчет от {{ data.last }} за {{ data.yr }} год
                        </div>
                        <div v-else  class="text-muted">
                            расчет не производился
                        </div>
                    </template>
                </v-col>
                <v-col cols="auto" class="rtx-route__price">
                    <v-chip v-if="data?.Price"
                            color="primary"
                            size="large"
                            variant="elevated">
                        {{ (data.Price).toLocaleString('ru-RU', {style: 'currency',  currency: 'RUB'}) }}
                    </v-chip>    
                </v-col>
            </v-row>
            <v-row v-if="has('data')" 
                   dense
                   class="rtx-route__total-meta">
                <v-col cols="auto">тариф: <b>{{ currformat(data.Tariff) }}</b></v-col>
                <v-col cols="auto">пассажиров: <b>{{ currformat(data.PassengerAmount) }}</b></v-col>
                <v-col cols="auto">выручка: <b>{{ currformat(data.Amount) }}</b></v-col>
                <v-col cols="auto">плата подрядчику: <b>{{ currformat(data.CostCarrier) }}</b></v-col>
                <v-col cols="auto">ст-ть работы ТС: <b>{{ currformat(data.CostVehicles) }}</b></v-col>
                <v-col cols="auto">
                        ст-ть б/н: 
                        <v-badge location="end center" offset-x="-18"
                                 color="grey-lighten-2">
                            <b>{{ currformat(data.CostOnline) }}</b>
                            <template v-slot:badge>
                                {{ data.PercentOnline || ''}}&nbsp;%
                            </template>
                        </v-badge>
                </v-col>
            </v-row>
        </v-card-title>
        <v-alert v-else class="mt-5">
            маршрут не выбран
        </v-alert>
        <v-card-text v-if="has('data')">
            <v-list class="rtx-route__indi"
                    v-model="selected">
                <v-list-item v-for="(i, n) in indiParts"
                             :key="'indi-' + i.id"
                             :title="i.title"
                             :value="i"
                             v-on:click="details(i)">
                    <template v-slot:prepend>
                        {{ i.code }}
                    </template>
                    <div class="text-muted" v-html="i.name"</div>    
                    <template v-slot:append>
                    </template>
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
    <teleport to="body">
        <rtx-route-indics ref="indics" />
    </teleport>    
</template>
<script setup lang="ts">
    import { ref, toRef, watch, onMounted } from "vue";
    import type { MapRoute } from "~/services/types";
    import { indiParts } from "~/services/indics";
    import { getRouteDetails } from "~/services/routes";
    import RtxRouteIndics from "~/components/route/RtxRouteIndics";
    
    const props = defineProps<{route?: MapRoute}>();
    
    const route = toRef(props, "route"),
          indics= ref(null);
    
    const { pending, data, error } = useAsyncData("route-nmck", async ()=>{
        if ( !route.value ){
            return null;
        }
        let res = await getRouteDetails(route.value, "nmck");
        console.log('nmck(data)', res);
        res = res.sort( (r1: any, r2: any)=>{
            return $moment(r1.startDt).isBefore(r2.startDt) ? -1 : 1;
        }).at(0);
        if ( res ){
            res.last = $moment(res.regDt).format("DD.MM.YYYY");
            res.yr   =   $moment(res.startDt).format("YYYY");
        }
        setTimeout(_adjust, 300);
        return res;
    }, {
        watch: [ route ]
    });
    
    watch(error, ()=>{
        if ( error.value ){
            $app.msg({text: `Ошибка получения данных НМЦК: ${ error.value.message }<br /> <small>${ error.value.data || ''}</small>`,
                     color: "warning"});
        }
    });

    function has(q: string): boolean{
        switch(q){
            case "route":
                return !!route.value;
            case "data":
                return !!data.value;
        }
        return false;
    }
    
    function _adjust(): void{
        const conte = $(".rtx-route__total");
        console.log('conte', conte);
        const t = conte.find(".v-card-title"),
              c = conte.find(".v-card-text");
        c.css({height: (conte.height() - t.height() - 18) + "px"});
    };  //_adjust

    const _formatter = new Intl.NumberFormat("ru-RU", {minimumFractionDigits: 0}),
          currformat: string = (n?: number) => {
            if ( n ){
                var n = Number(n);
                return Number.isNaN(n) ? '' : _formatter.format(n);
            }
            return '';
        };
        
    function details(part){
        console.log('opening route/part', route, part);
        indics.value.open(unref(route), unref(part));
    };  //details
        
</script>
<style lang="scss">
    .rtx-route{
        &__total{
            &.v-card{
                height: 100%;
                .v-card-title{
                    line-height: 1.115;
                }
                &.empty{
                    .v-card-title{
                        & span{
                            color: grey;
                        }
                    }
                }
                .v-card-text{
                    overflow-y: auto;
                    padding-bottom: 3rem;
                }
            }
            &-meta{
                font-size: 0.85rem;
                & .v-col{
                    &:not(:last-child){
                        margin-right: 0.25rem;
                        padding-right: 0.25rem;
                        border-right: 1px solid #ddd;
                    }
                }
            }
        }
        &__price{
            justify-self: flex-end;
        }
        &__indi{
            & .v-list-item{
                padding-left: 3.5rem !important;
                &:has(.v-list-item__prepend){
                    padding-left: 0 !important;
                }
                &__prepend{
                    width: 3rem;
                    font-weight: 600;
                    text-align: right;
                    align-items: flex-end;
                }
            }
        }
    }
</style>
       