<template>
    <v-form ref="form" class="h-100">
        <v-container class="fill-height" fluid>
            <v-row justify = "center" align="center" class="h-100">
                <v-col cols="6" xs="6" class="fill-height">
                    <v-card class="fill-height" elevation="3">
                        <v-card-text>
                            <template v-for="(item, i) in parameters" :key="i">
                                <div class="headline mb-4 text-primary">{{ item.title }}</div>
                                <jet-input-id v-if="item.value?.type == 'id'" :uri="item.value.uri"
                                        :type="item.value.type" :name="item.name" v-model="item.value.value" :label="item.value.label" :required="item.value.required" />
                                <rtx-contracts-tbl v-if="item.value?.type == 'table'" :item="item"/>
                            </template>
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="6" xs="6" class="fill-height">
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

const model = ref([
        {
            num: 1,
            name: 'routeID',
            title: 'Выберите маршрут',
            value: {type: 'id', uri : IDS.ROUTES_URI, required: true, label: 'Маршрут', value: null}
        }
    ]),
    result = {},
    algorytm = ref(null);

const { load } = useCore();

const tenant = profile.tenant.id;

const { pending, error } = useAsyncData( 'algorytms', async() => {
    if ( !result.typeID ) {
        return;
    }
    const uri = `${IDS.CTALG_URI}?filter=eq(field(".typeID"), param("${result.typeID}", "id"))`;
    const res = await load({uri: uri});
    algorytm.value = JSON.parse(res.values[0]['trpricealgorytms.typealgorytm']);
});

const { data: route } = useAsyncData( 'route', async() => {
    if ( !result.routeID )
        return;
    const uri = `${IDS.FULLROUTES_URI}?id=${result.routeID}`;
    const res = await load({uri: uri});
    return res.values[0];
});

const { data: normatives } = useAsyncData( 'standards', async() => {
    const uri = IDS.NORM_URI;
    const res = await load({uri: uri});
    return res.values;
});

const _next = async () => {
    if ( !algorytm.value ) {
        await refreshNuxtData('algorytms');
    }
    if ( algorytm.value.length > 0 ) {
        model.value.push(algorytm.value[0]);
        algorytm.value.splice(0, 1);
    };
};

const _route = () => {
    if ( model.value.filter((m) => m.name == 'typeID').length == 0 ) {
        model.value.push({
            num: 2,
            name: 'typeID',
            title: 'Выберите тип контракта',
            value: {type: 'id', uri : IDS.CTYPES_URI, required: true, label: 'Тип контракта', value: null}
        });
    }
    refreshNuxtData('route');
};

const _calc = () => {
    Object.keys(result).map((key) => {
        const item = model.value.filter((m) => m.name == key);
        if ( item[0].formula ) {
            item[0].formula.value = eval(item[0].formula.var);
        }
    });
    //console.log(result);
};

const _normative = (code) => {
    return normatives.filter((n) => n['trstandards.stcode'] == code);
}

const parameters = computed(() => {
    return model.value.filter((m) => m.value);
});

watch(model.value, (newValue) => {
    const old = { ...result };
    newValue.map((v) => {
        result[v.name] = v.value?.value || v.formula?.value;
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