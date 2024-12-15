<template>
    <rtx-db-card icon="mdi-calculator-variant-outline"
                 title="НМЦК">
        <div class="rtx-db__costs"></div>
    </rtx-db-card>
</template>
<script setup lang="ts">
    import * as echarts from 'echarts';
    import RtxDbCard from "./RtxDbCard";
    import { watchDom } from "jet-ext/utils";
    import { default as all } from "~/composables/all";
    
    let chart: any,
        conte: DOMNode|null = null;
    
    const costs:Ref<any> = computed( ()=> all.indics?.prices?.at(0));
    
    async function _ready(){
        return new Promise( (resolve, reject) => {
            let n = 0,
            _watch = ()=>{
                n++;
                if ( n > 100 ){
                    reject("No ready");
                } else if ( costs.value ){
                    watchDom(".rtx-db__costs").then( $conte=>{ conte = $conte; resolve();} );
                } else {
                    setTimeout(_watch, 100);
                }
            };
            _watch();
        });
    };  //_ready
    
    _ready().then( ()=>{
        console.log('tarifs', costs);
        chart = echarts.init(conte);
        let opts = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}<br />{c}'
            },
            series: [{
                    name: 'Funnel',
                    type: 'funnel',
                    left: '5%',
                    top: 0,
                    bottom: 0,
                    width: '90%',
                    min: costs.value.min/1.2,
                    max: costs.value.max,
                    minSize: '0%',
                    maxSize: '100%',
                    top: 10,
                    bottom: 10,
                    sort: 'descending',
                    gap: 1,
                    label: {
                      show: true,
                      position: 'inside'
                    },
                    labelLine: {
                      length: 10,
                      lineStyle: {
                        width: 1,
                        type: 'solid'
                      }
                    },
                    itemStyle: {
                      borderColor: '#fff',
                      borderWidth: 1
                    },
                    emphasis: {
                      label: {
                        fontSize: 10
                      }
                    },
                    data: [
                            { value: Number(costs.value.max).toFixed(1), name: 'Max' },
                            { value: Number(costs.value.avg).toFixed(1), name: 'Avg' },
                            { value: Number(costs.value.min).toFixed(1), name: 'Min' }
                    ]
            }]
        };
        chart.setOption(opts);
    }).catch(e => {
        console.log('ERR (ready)', e);
    });
    
</script>
<style lang="scss">
    .rtx-db__costs{
        width: 100%;
        height: 180px;
    }
</style>