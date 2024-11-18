<template>
    <v-container class="fill-height" fluid>
        <v-row justify = "center" align="center" class="h-100">
            <v-col cols="3" xs="6" class="fill-height">
                <v-form ref="form" class="h-100">
                    <v-card class="fill-height" elevation="3">
                        <v-card-text>
                            <jet-input-id :uri="IDS.ROUTES_URI"
                                type="id" name="Маршрут" v-model="routeID" label="Маршрут" :required="true" />
                            <template v-for="(direction, i) in directions" :key="i">
                                <divider />
                                <div class="text-caption">
                                    Направление: <span class="text-caption">{{ direction.direction }}</span>
                                    <v-text-field label="Первый рейс" v-model="direction.starttm" type="time" :rules="rules"/>
                                </div>
                            </template>
                            <div class="text-caption">
                                Количество рейсов: <span class="text-primary text-h6">{{ trips }}</span>
                            </div>
                            <v-slider v-model="trips" color="primary" :step="1"/>
                            <div class="text-caption">
                                Интервал между рейсами (мин.): <span class="text-primary text-h6">{{ interval }}</span>
                            </div>
                            <v-slider v-model="interval" color="primary" :step="1"/>
                        </v-card-text>
                        <v-card-actions class="justify-end">
                            <v-btn variant="flat" size="small" color="primary" @click="calculate" :loading="busy">Рассчитать</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-form>
            </v-col>
            <v-col cols="9" xs="6" class="fill-height details">
                <v-card elevation="3" v-if="route">
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
                        <template v-if="schedules.length > 0">
                            <template v-for="(direction, i) in directions" :key="i">
                                <div class="headline mb-4 text-primary">{{ direction.direction }}</div>
                                <v-expansion-panels flat>
                                    <v-expansion-panel v-for="(trip, i) in schedules.filter((s) => s.direction == direction.id).sort((a, b) => a.num - b.num)" :key="i">
                                        <v-expansion-panel-title>
                                            Рейс № {{ trip.num }}. C {{ trip.starttm }} по {{ trip.endtm }}
                                        </v-expansion-panel-title>
                                        <v-expansion-panel-text>
                                            <v-list>
                                                <v-list-item v-for="(stop, i) in trip.stops" :key="i">
                                                    <v-list-item-title>
                                                        {{ stop.pointname }} : {{ format(stop.arrtime) }}
                                                    </v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                        </v-expansion-panel-text>
                                    </v-expansion-panel>
                                </v-expansion-panels>
                            </template>
                        </template>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { profile } from 'jet-ext/composables/profile';
import { getRouteDirections, calcRouteSchedule } from '~/services/routes';
import useCore from '~/composables/core';

import JetInputId from "jet-ext/components/form/editors/JetInputId";

const { load } = useCore();

const IDS = {
    ROUTES_URI    : 'sin2:/v:39e0099c-1747-45c5-9c61-bec8a790f2ae',
    FULLROUTES_URI: 'sin2:/v:63cb4030-8bd7-40c5-820e-e7613769a8cc',
    STOPS_URI     : 'sin2:/v:82afed8e-11c9-4ee5-8ac5-fe7f567531bf'
}
const routeID  = ref(null),
    trips = ref(10),
    interval = ref(10),
    form = ref(null),
    schedules = ref([]),
    busy = ref(false);

const rules = computed(() => {
    return [
        v => !!v || 'Поле должно быть заполнено',
    ]
});

const { data: route } = useAsyncData( 'route', async() => {
    if ( !routeID.value )
        return;
    const uri = `${IDS.FULLROUTES_URI}?id=${routeID.value}`;
    const res = await load({uri: uri});
    return res.values[0];
}, {
    watch: [routeID]
});

const { data: directions } = useAsyncData( 'directions', async() => {
    if ( !routeID.value )
        return;
    const res = await getRouteDirections(routeID.value);
    return res;
}, {
    watch: [routeID]
});

const calculate = async() => {
    const { valid } = await form.value.validate();
    if ( !valid )
        return;
    console.log(directions);
    busy.value = true;
    schedules.value = await calcRouteSchedule(routeID.value, trips.value, interval.value, directions.value);
    busy.value = false;
    console.log(schedules.value);
};

const format = (v) => {
    return $moment(v).format('HH:mm');
}
</script>