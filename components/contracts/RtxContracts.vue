<template>
    <v-toolbar density="compact" app>
        <v-btn tile icon="mdi-chevron-left"
               to="/" />
        <v-divider vertical />
        <v-spacer />
        <v-btn tile icon="mdi-reload"
               v-on:click="recalc" />
    </v-toolbar>
    <v-container class="fill-height pa-0 rx-contra" fluid>
        <splitpanes class="fill-height default-theme">
            <pane min-size="20" 
                  :size="30">
                <v-card flat tile>
                    <v-card-text>
                        <template v-for="(p, i) in params" :key="i">
                            <div class="rx-contra__title">
                                {{ p.name }}
                                <v-btn size="small"
                                       tile
                                       flat
                                       v-if="/(план\sчас)+/i.test(p.name)"
                                       icon="mdi-calendar-month"
                                       to="/calendar"></v-btn>
                            </div>
                            <jet-input-id v-if="(p.type == 'id')" 
                                          :uri="p.uri"
                                          :type="p.type" 
                                          :name="p.name" 
                                          v-model="p.value" 
                                          :label="p.label" 
                                          :required="p.required" />
                            <rtx-contracts-tbl v-if="(p.type == 'table')" 
                                               :item="p" 
                                               @update:modelValue="_next(p)"/>
                        </template>
                    </v-card-text>
                </v-card>
            </pane>
            <pane>
                <v-card v-if="route" 
                        class="details"
                        flat tile>
                    <v-card-title>
                        {{ route['trroutes.routecode'] }} {{ route['trroutes.routename'] }}
                    </v-card-title>
                    <v-card-subtitle>
                        <v-row>
                            <v-col>Протяженность: {{ route['trroutes.routelength'] }} км. </v-col>
                            <v-col cols="3">
                                <v-btn class="justify-end" variant="flat" size="small" append-icon="mdi-map" color="primary" @click="to_map(vc)">
                                    На карте
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card-subtitle>
                    <v-card-text>
                        <template v-for="(p, i) in calculated" :key="i">
                            <div class="headline text-primary">{{ p.name }}</div>
                            <jet-input-id v-if="p.type == 'id'" 
                                          :uri="p.uri"
                                          :type="p.type" :name="p.name" 
                                          v-model="p.value" 
                                          :label="p.label" 
                                          :required="p.required" />
                            <rtx-contracts-tbl v-if="p.type == 'table'" :item="p" v-model="p.value" @update:modelValue="_next()"/>
                        </template>
                    </v-card-text>
                </v-card>
            </pane>
        </splitpanes>
    </v-container>
</template>

<script setup>
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import { default as all } from "~/composables/all";
import useCore from '~/composables/core';
import { profile } from 'jet-ext/composables/profile';
import { empty } from 'jet-ext/utils';

import JetInputDate from "jet-ext/components/form/editors/JetInputDate";
import JetInputId from "jet-ext/components/form/editors/JetInputId";
import JetInputNumber from "jet-ext/components/form/editors/JetInputNumber";
import JetInputBoolean from "jet-ext/components/form/editors/JetInputBoolean";
import JetInputString from "jet-ext/components/form/editors/JetInputString";
import RtxContractsTbl from "~/components/contracts/RtxContractsTbl";

const IDS = {
    ROUTES_URI    : 'sin2:/v:39e0099c-1747-45c5-9c61-bec8a790f2ae',
    CTYPES_URI    : 'sin2:/v:37cd1c08-fcc1-4aab-a255-045777459ad0',
    CTALG_URI     :  'sin2:/v:0c275166-5db8-4c5e-8672-75341e4fba77',
    FULLROUTES_URI: 'sin2:/v:63cb4030-8bd7-40c5-820e-e7613769a8cc',
    NORM_URI      : 'sin2:/v:b247a253-baab-4cd4-a413-f57b7c5fb415'
};

const nodes  = reactive([
        {
            key: 'routeID',
            name: 'Выберите маршрут',
            type: 'id',
            uri: IDS.ROUTES_URI,
            required: true,
            label: 'Маршрут',
            var: true,
            value: null
        }
    ]),
    result   = {
        sum: (node, attr) => {
            if ( !Array.isArray(result[node]) )
                return result[node];
            let s = 0;
            result[node].forEach( n => {
                s = s + ( Number.isNaN(n[attr]) ? 0 : Number(n[attr]) );
            });
            return s;
        }
    },
    template = ref(null),
    node     = ref(null),     //active node in template for calcs
    params = computed(() => {
        return nodes.filter( node => node.var );
    }),
    calculated = computed(() => {
        return nodes.filter( node => !node.var);
    }),
    routeId = computed({
        get: () => {
            let n = nodes.findIndex( $n => ($n.key === "routeID"));
            return ( n > -1 ) ? nodes.value[n].value : null;
        },
        set: val => {
            let n = nodes.findIndex( $n => ($n.key === "routeID"));
            if ( n > -1 ){
                let p = { ...nodes[n] };
                p.value = val;
                nodes.splice(n, 1, p);
            }
        }
    });

if ( !empty(all.routes.active?.id) ) {
    routeId.value = all.routes.active.id;
    _route();
}

const { load } = useCore();

const tenant = profile.tenant.id;

const { pending, error } = useAsyncData( 'template', async() => {
    if ( !result.typeID ) {
        return;
    }
    const uri = `${IDS.CTALG_URI}?filter=eq(field(".typeID"), param("${ result.typeID }", "id"))`;
    const res = await load({uri: uri});
    template.value = JSON.parse(res.values[0]['trpricealgorytms.typealgorytm']);
});

const { data: route } = useAsyncData( 'route', async() => {
    if ( !result.routeID )
        return;
    const uri = `${IDS.FULLROUTES_URI}?id=${result.routeID}`;
    const res = await load({uri: uri});
    return res.values[0];
});

const { data: normatives } = useAsyncData( 'normatives', async() => {
    const uri = IDS.NORM_URI;
    const res = await load({uri: uri});
    return res.values;
});

const _next = async (src = null) => {
    try {
        if ( !template.value ) {
            await refreshNuxtData('template');
            node.value = null;
        }
        console.log('template', template.value);

        if ( !(template.value?.length > 0) ){
            throw new Error('no template');
        }
                
        let v, n, key = src?.key || node.value?.key || null;
        n = empty(key) ? -1 : template.value.findIndex( t => (t.key === key) );
        v = template.value.at(n + 1);

/*
        if ( src ){
            n = template.value.findIndex( t => t.key === src.key );
            v.index = n;
        } else if ( node.value ){
            n = template.value.findIndex( t => t.key === node.value.key );
            v = template.value.at(n + 1);
            v.index = n + 1;
        } else {
            v = template.value.at(0);
            v.index = 0;
        }
*/
        //const v = template.value[0];
        if ( !v ){
            console.log("FINISH");
            return;
        }
            
        console.log('next for', v);
        if ( v.type === 'table' ) {
            v.props.forEach(async p => {
                if ( p.type === 'id' ) {
                    const res = await load({uri: 'sin2:/v:' + p.class});
                    const keyCol = res.model.key;
                    const titleCol = res.model.columns.filter(c => c.attributes.asName)[0].id.toLowerCase();
                    const values = [];
                    res.values.forEach( val => {
                        values.push({id: val[keyCol], name: val[titleCol]});
                    });
                    p.items = values;
                }
            });
            if ( v.source ) {
                const src = result[v.source];
                v.value = [];
                src.forEach( s => {
                    const val = {};
                    v.props.forEach( p => {
                        val[p.key] = (p.values) ? s[p.values] : null;
                    });
                    v.value.push(val);
                });
            } else {
                v.value = [{}];
                v.props.forEach( p => {
                    v.value[0][p.key] = null;
                });
            }
        }

        //next active node
        n = nodes.findIndex( $n => ($n.key === v.key) );
        if ( n < 0 ){
            nodes.push(v);
        } else {
            nodes.splice(n, 1, v);
        }
        node.value = v;
            
        //template.value.splice(0, 1);
        if ( !v.var ){
            _next();
        }
    } catch(e){
        console.log('ERR(next)', e);
    }
};  //_next

function _route(){
    let n = nodes.findIndex( m => (m.key === 'typeID') );
    if ( n < 0 ) {
        nodes.push({
            key: 'typeID',
            name: 'Выберите тип контракта',
            type: 'id',
            uri: IDS.CTYPES_URI,
            required: true,
            label: 'Тип контракта',
            var: true,
            value: null
        });
    } else {
        //reset calc`s
        while (nodes.length > n + 1){
            nodes.splice(nodes.length - 1, 1);
        }
    }
    refreshNuxtData('route');
};  //_route

const _calc = () => {
    Object.keys(result).forEach( key => {
        let node = nodes.filter( m => m.key === key).at(0);
        if ( !node ){
            console.log(`no calc ${ key }`, nodes);
            return;
        }
        try {
            if ( node.calc ) {
                node.value = eval(node.calc);
                return;
            }
            if ( !node.props ) {
                return;
            }
            node.props.forEach( p => {
                if ( p.calc ) {
                    for (var i = 0; i < result[key].length; i++ ) {
                        const val = eval(p.calc);
                        if ( !!val ) 
                            result[key][i][p.key] = val;
                    }
                }
            });
        } catch(e){
            console.warn('ERR(calc)', e);
        }
    });
    console.log(`calc`, result);
};

function _normative(code, cls, fuel, capacity){
    let g, ngroup = normatives.value.filter( n => n['trstandards.stcode'] == code);
    if ( cls ) {
        ngroup = ngroup.filter( n => n['trstandardvalues.stvcid'] == cls);
    }
    if ( fuel ){
        ngroup = ngroup.filter( n => n['trstandardvalues.stftid'] == fuel);
    }
    if ( capacity ){
        ngroup = ngroup.filter( n=> (n['trstandardvalues.mincapacity'] <= capacity || !n['trstandardvalues.mincapacity']) 
            && (n['trstandardvalues.maxcapacity'] >= capacity || !n['trstandardvalues.maxcapacity']));
    }
    g = ngroup.at(0);
    return g ? g['trstandardvalues.stvalue'] : null;
};

window["_normative"] = _normative;


function recalc(){
    console.log('recalc', nodes);
    if ( nodes.length > 0) {
        let last = nodes.at(nodes.value.length - 1);
        console.log('last value/template', last, template);
        _calc();
    }
};  //recalc


watch(nodes, newValue => {
    console.log('nodes (watch)', nodes);
    const old = { ...result };
    
    newValue.forEach( v => {
        result[v.key] = v.value || v.formula?.value;
    });
    
    if ( old.routeID !== result.routeID ) {
        _route();       
    } 
    
    if ( old.typeID !== result.typeID){
        _next();
    }
        
    _calc();
});

</script>
<style lang="scss">
    .rx-contra{
        & .splitpanes{
            height: 100%;
            &__pane {
                height: 100%;
                & .v-card{
                    height: 100%;
                }
            }
        }
        &__title{
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 1rem 0 0.5rem 0;
            color: rgb(var(--v-theme-primary));
        }
        & .details{
            & .v-card {
                &-subtitle{
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #efefef;
                }
                &-text{
                    height: calc(100dvh - 148px);
                    overflow-y: auto;
                    padding-bottom: 10rem;
                }
            }
        }
    }
</style>    