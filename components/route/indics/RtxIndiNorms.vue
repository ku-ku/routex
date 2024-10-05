<template>
    <v-toolbar color="white">
        <v-autocomplete label="раздел"
                        v-model="part"
                        class="rt-parts"
                        :items="parts"
                        item-title="stName"
                        item-value="ID"
                        return-object
                        style="width:100%;">
            <template v-slot:selection="{ item }">
                {{ item.raw.stCode}}.&nbsp;{{ item.raw.stName }}
            </template>    
            <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props" 
                             class="rt-parts__item"
                             :title="item.raw.stCode +'. ' + item.raw.stName">
                </v-list-item>
            </template>
        </v-autocomplete>
        <v-spacer />
        <div class="ml-3">
            <v-btn-toggle multiple v-model="distrib">
                <v-tooltip>
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props"
                               flat icon="mdi-bus-multiple"
                               size="small"
                               :value="1"></v-btn>
                    </template>    
                    <span>распределить по классам ТС</span>
                </v-tooltip>
                <v-tooltip>
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props"
                               flat icon="mdi-barrel"
                               size="small"
                               :value="2"></v-btn>
                    </template>
                    <span>распределить по видам топлива</span>
                </v-tooltip>
            </v-btn-toggle>
        </div>
    </v-toolbar>
    <v-container fluid class="rt-part__norms">
        <v-row dense>
            <v-col cols="auto">Дата</v-col>
            <template v-if="has('vehics')||has('fuels')">
                <template v-if="has('vehics')">
                    <v-col v-for="v in vehics"
                           :key="v.ID"
                           cols="auto" style="width: 8rem;">
                        {{ v.className }}
                    </v-col>
                </template>
                <template v-if="has('fuels')">
                    <v-col v-for="v in fuels"
                           :key="v.ID"
                           cols="auto" style="width: 8rem;">
                        {{ v.typeName }}
                    </v-col>
                </template>
            </template>
            <template v-else>
                <v-col cols="auto"  style="width: 12rem;">значение</v-col>
            </template>    
        </v-row>
        <v-row dense 
               align-center
               v-for="n in norms"
               :key="n.id">
            <v-col cols="auto">
                {{ format( n.regDt ) }}
            </v-col>
            <template v-if="has('vehics')||has('fuels')">
                <template v-if="has('vehics')">
                    <v-col cols="auto" style="width: 8rem;"
                           v-for="v in n.vehics">
                        <jet-input-number type="float" label="" name="v.id" 
                                          required
                                          v-model="v.stValue" 
                                          hide-details />
                    </v-col>
                </template>
                <template v-if="has('fuels')">
                    <v-col cols="auto" style="width: 8rem;"
                           v-for="v in n.fuels">
                        <jet-input-number type="float" label="" name="v.id" 
                                          required
                                          v-model="v.stValue" 
                                          hide-details />
                    </v-col>
                </template>
            </template>
            <template v-else>
                <v-col cols="auto" style="width: 8rem;">
                    <jet-input-number type="float" label="" name="n.id" 
                                      required
                                      v-model="n.stValue" 
                                      hide-details />
                </v-col>
            </template>    
        </v-row>
    </v-container>        
</template>
<script setup lang="ts">
import { watch } from "vue";
import JetInputNumber from "jet-ext/components/form/editors/JetInputNumber";
import { getVehicleClasses, getFuelKinds } from "~/services/references";
import { getparts, getnorms } from "~/services/norms";

declare const $moment: any;

const part = ref(null),
      parts = ref([]),
      fuels = ref([]),
      vehics= ref([]),
      norms = ref([]),
      distrib=ref([]); /*buttons model */

const $distrib = computed(()=>{ /* masks: 0 - none, 1 - by vehicles, 2 - by fuel */
    let d = 0;
    if ( distrib.value.findIndex( d => d === 1) > -1 ) {
        d = d | 1;
    }
    if ( distrib.value.findIndex( d => d === 2) > -1 ) {
        d = d | 2;
    }
    return d;
});

const { pending } = useAsyncData( "norms-parts", async () => {
    if ( !(parts.value?.length > 0 ) ){
        parts.value = await getparts();
    }
    if ( !(vehics.value?.length > 0 ) ){
        vehics.value = await getVehicleClasses();
        console.log('vehics', vehics.value);
    }
    if ( !(fuels.value?.length > 0 ) ){
        fuels.value = await getFuelKinds();
        console.log('fuels', fuels.value);
    }
    return parts.value.lenght;
});

function format(d: string): string{
    return $moment(d).format("DD.MM.YYYY");
}

function _norms_norms($all: Array<any>): void{
    if ( $distrib.value === 0 ){
        norms.value = $all;
    }
    if ( !Array.isArray($all) ){
        norms.value = [];
        return;
    }
    let dates = []; //unique dates
    $all.forEach( $d => {
        const d = $moment($d.regDt);
        if ( dates.findIndex( dt => { return d.isSame(dt.regDt, 'day'); }) < 0 ){
            dates.push($d);
        }
    });
    
    dates.forEach( $d => {
        const d = $moment($d.regDt);
        if ( has("vehics") ){
            $d.vehics = [];
            vehics.value.forEach( $v => {
                let v = { ...$v },
                   v1 = $all.filter( n => d.isSame(n.regDt, 'day') && n.stVcID === v.ID).at(0);
                v.stValue = v1 ? v1.stValue : null;
                $d.vehics.push( v );
            });
        }
        if ( has("fuels") ){
            $d.fuels = [];
            fuels.value.forEach( $v => {
                let v = { ...$v },
                   v1 = $all.filter( n => d.isSame(n.regDt, 'day') && n.stFtID === v.ID).at(0);
                v.stValue = v1 ? v1.stValue : null;
                $d.fuels.push( v );
            });
        }
    });
    console.log('norms (dates)', dates);
    norms.value = dates;
};

/** 
 * All values by part
 */
const {data: all} = useAsyncData( "norms-norms", async () => {
    distrib.value = [];
    norms.value   = [];
    if ( part.value ){
        try {
            pending.value = true;
            let d = 0,
                $norms = await getnorms(part.value.ID);
            console.log('norms', norms);
            $norms.forEach( n => {
                if ( n.stVcID ){
                    d = d | 1;
                }
                if ( n.stFtID ){
                    d = d | 2;
                }
            });
            if ( d & 1 ){
                distrib.value.push(1);
            }
            if ( d & 2 ){
                distrib.value.push(2);
            }
            _norms_norms($norms);
            return $norms;
        } finally {
            pending.value = false;
        }
    }
    return null;
}, {
    watch: [ part ]
});

watch(distrib, (val: any) => {
    _norms_norms(all.value);
});

function has(q: string): boolean {
    switch(q){
        case "vehics":
            return ($distrib.value & 1) === 1;
        case "fuels":
            return ($distrib.value & 2) === 2;
    }
    return false;
}

</script>
<style lang="scss">
    .rt-parts{
        &__item{
            font-size: 0.9rem;
            &:not(:last-child){
                border-bottom: 1px solid #efefef;
            }
        }
        & .v-autocomplete__selection{
            display: inline-block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
    .rt-part{
        &__norms{
            font-size: 0.85rem;
            overflow-x: auto;
            width: 100%;
            & .v-row{
                flex-wrap: no-wrap;
                & .v-col{
                    white-space: wrap;
                    line-height: 1.115;
                    &:nth-child(1){
                        align-self: flex-end;
                        width: 6rem;
                    }
                    & input{
                        font-size: 0.85rem;
                    }
                }
            }
        }
    }
</style>