<template>
    <rtx-db-card icon="mdi-currency-rub"
                 title="тарифы">
        <div class="rtx-db__tarifs"></div>
    </rtx-db-card>
</template>
<script setup lang="ts">
    import * as echarts from 'echarts';
    import RtxDbCard from "./RtxDbCard";
    import { watchDom } from "jet-ext/utils";
    import { default as all } from "~/composables/all";
    
    let chart: any,
        conte: DOMNode|null = null;
    
    const tarifs:Ref<any[]> = computed( ()=> all.indics?.tarif||[]);
    
    async function _ready(){
        return new Promise( (resolve, reject) => {
            let n = 0,
            _watch = ()=>{
                n++;
                if ( n > 100 ){
                    reject("No ready");
                } else if ( tarifs.value.length > 0 ){
                    watchDom(".rtx-db__tarifs").then( $conte=>{ conte = $conte; resolve();} );
                } else {
                    setTimeout(_watch, 100);
                }
            };
            _watch();
        });
    };  //_ready
    
    _ready().then( ()=>{
        console.log('tarifs', tarifs);
        chart = echarts.init(conte);
        let opts = {
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              containLabel: true
            },
            xAxis: {
              type: 'value',
              boundaryGap: [0, 0.01]
            },
            yAxis: {
              type: 'category',
              data: tarifs.value
            },
            series: [{
                type: 'bar',
                data: tarifs.value
            }]
        };    
        chart.setOption(opts);
    }).catch(e => {
        console.log('ERR (ready)', e);
    });
    
</script>
<style lang="scss">
    .rtx-db__tarifs{
        width: 100%;
        height: 180px;
    }
</style>