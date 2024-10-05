<template>
    <v-form ref="form" class="h-100">
        <v-container class="fill-height" fluid>
            <v-row justify = "center" align="center" class="h-100">
                <v-col cols="3" xs="6" class="fill-height">
                    <v-card class="fill-height" elevation="3">
                        <v-card-text>
                            <template v-for="(p, i) in params" :key="i">
                                <div class="headline mb-4 text-primary">{{ p.name }}</div>
                                <jet-input-id v-if="p.type == 'id'" :uri="p.uri"
                                        :type="p.type" :name="p.name" v-model="p.value" :label="p.label" :required="p.required" />
                                <rtx-contracts-tbl v-if="p.type == 'table'" :item="p" v-model="p.value" @update:modelValue="_next()"/>
                            </template>
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="9" xs="6" class="fill-height">
                    <v-card class="fill-height" elevation="3" v-if="route">
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
                                <div class="headline mb-4 text-primary">{{ p.name }}</div>
                                <jet-input-id v-if="p.type == 'id'" :uri="p.uri"
                                        :type="p.type" :name="p.name" v-model="p.value" :label="p.label" :required="p.required" />
                                <rtx-contracts-tbl v-if="p.type == 'table'" :item="p" v-model="p.value" @update:modelValue="_next()"/>
                            </template>
                        </v-card-text>
                        <v-card-actions class="justify-end">
                            <v-btn variant="outlined" color="grey-darken-2">Отмена</v-btn>
                            <v-btn variant="outlined" color="primary">Сохранить</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-form>
</template>

<script setup>
import useCore from '~/composables/core';
import { profile } from 'jet-ext/composables/profile';

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
}

const nodes  = ref([
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
            result[node].map((n) => {
                s = s + Number(n[attr]);
            });
            return s;
        }
    },
    template = ref(null),
    params = computed(() => {
        return nodes.value.filter((node) => node.var);
    }),
    calculated = computed(() => {
        return nodes.value.filter((node) => !node.var);
    });

const { load } = useCore();

const tenant = profile.tenant.id;

const { pending, error } = useAsyncData( 'template', async() => {
    if ( !result.typeID ) {
        return;
    }
    const uri = `${IDS.CTALG_URI}?filter=eq(field(".typeID"), param("${result.typeID}", "id"))`;
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

const _next = async () => {
    if ( !template.value ) {
        await refreshNuxtData('template');
    }
    if ( template.value.length > 0 ) {
        const v = template.value[0];
        if ( v.type == 'table' ) {
            v.props.map(async (p) => {
                if ( p.type == 'id' ) {
                    const res = await load({uri: 'sin2:/v:' + p.class});
                    const keyCol = res.model.key;
                    const titleCol = res.model.columns.filter(c => c.attributes.asName)[0].id.toLowerCase();
                    const values = [];
                    res.values.map((val) => {
                        values.push({id: val[keyCol], name: val[titleCol]});
                    });
                    p.items = values;
                }
            });
            if ( v.source ) {
                const src = result[v.source];
                v.value = [];
                src.map((s) => {
                    const val = {};
                    v.props.map( (p) => {
                        val[p.key] = (p.values) ? s[p.values] : null;
                    });
                    v.value.push(val);
                });
            } else {
                v.value = [{}];
                v.props.map( (p) => {
                    v.value[0][p.key] = null;
                });
            }
        }
        nodes.value.push(v);
        template.value.splice(0, 1);
        if ( !v.var )
            _next();
    };
};

const _route = () => {
    if ( nodes.value.filter((m) => m.key == 'typeID').length == 0 ) {
        nodes.value.push({
            key: 'typeID',
            name: 'Выберите тип контракта',
            type: 'id',
            uri: IDS.CTYPES_URI,
            required: true,
            label: 'Тип контракта',
            var: true,
            value: null
        });
    }
    refreshNuxtData('route');
};

const _calc = () => {
    Object.keys(result).map((key) => {
        let node = nodes.value.filter((m) => m.key == key);
        if ( node.length == 0 )
            return;
        node = node[0];
        if ( node.calc ) {
            node.value = eval(node.calc);
            return;
        }
        if ( !node.props ) 
            return;
        node.props.map((p) => {
            if ( p.calc ) {
                for (var i = 0; i < result[key].length; i++ ) {
                    const val = eval(p.calc);
                    if ( !isNaN(val) ) 
                        result[key][i][p.key] = val;
                }
            }
        });
    });
};

const _normative = (code, cls, fuel) => {
    let ngroup = normatives.value.filter((n) => n['trstandards.stcode'] == code);
    if ( cls )
        ngroup = ngroup.filter((n) => n['trstandardvalues.stvcid'] == cls);
    if ( fuel )
        ngroup = ngroup.filter((n) => n['trstandardvalues.stftid'] == fuel);
    return ngroup[0]['trstandardvalues.stvalue'];
}

watch(nodes.value, (newValue) => {
    const old = { ...result };
    newValue.map((v) => {
        result[v.key] = v.value || v.formula?.value;
    });
    if ( old.routeID !== result.routeID ) {
        _route();       
    } else if ( old.typeID !== result.typeID ) {
        _next();
    } else {
        _calc();
    }
});
</script>