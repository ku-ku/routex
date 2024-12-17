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
        chart = echarts.init(conte);
        let min = Number.MAX_SAFE_INTEGER,
            max = 0,
            source = [['tarif', 'тариф']];
            
        tarifs.value.forEach(t => {
            source.push([`${ t }`, t]);
            if ( min > Number(t) ){
                min = Number(t);
            }
            if ( max < Number(t) ){
                max = Number(t);
            }
        });
        
        console.log('tarifs', tarifs.value, source);
        
        let opts = {
            dataset: {
                source
            },
            grid: { containLabel: false },
            xAxis: { name: 'тариф' },
            yAxis: { type: 'category' },
            visualMap: {
                orient: 'horizontal',
                left: 'center',
                min: min,
                max: max,
                text: [`макс.`, `мин.`],
                dimension: 1,
                inRange: {
                    color: ['#65B581', '#FFCE34', '#FD665F']
                }
            },
            series: [{
                type: 'bar',
                encode: {
                    x: 'тариф',
                    y: 'tarif'
                }
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