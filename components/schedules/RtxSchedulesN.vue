<template>
    <v-container class="fill-height" fluid>
        <v-row justify = "center" align="center" class="h-100">
            <v-col cols="3" xs="6" class="fill-height">
                <v-form ref="form" class="h-100">
                    <v-card class="fill-height" elevation="3">
                        <v-card-text>
                            <jet-input-date label="Дата начала" :required="true" name="Дата начала" v-model="startDt"/>
                            <jet-input-date label="Дата окончания" :required="true" name="Дата окончания" v-model="endDt"/>
                            <jet-input-id :uri="IDS.ROUTES_URI"
                                type="id" name="Маршрут" v-model="routeID" label="Маршрут" :required="true" />
                            <template v-for="(direction, i) in directions" :key="i">
                                <divider />
                                <div class="text-caption">
                                    Направление: <span class="text-caption">{{ direction.direction }}</span>
                                    <v-text-field label="Первый рейс" v-model="direction.starttm" type="time" :rules="rules"/>
                                </div>
                            </template>
                            <div class="headline text-primary">{{ intervals.name }}</div>
                            <rtx-contracts-tbl :item="intervals" v-model="intervals.value" @update:modelValue="calculate"/>
                            <divider />
                            <div class="headline text-primary">График движения</div>
                            <v-item-group class="d-flex justify-sm-space-between pt-2 pb-6">
                                <v-item v-for="(d, n) in days" :key="n">
                                    <v-avatar @click="d.active=!d.active" border class="cursor-pointer mx-1" :color="(d.active) ? 'primary' : ''">
                                        {{ d.name }}
                                    </v-avatar>
                                </v-item>
                            </v-item-group>
                            <v-checkbox label="Праздничные" color="primary" v-model="holiday"/>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn size="small" variant="text" prepend-icon="mdi-close" v-on:click="close(false)">закрыть</v-btn>
                            <v-btn size="small" variant="elevated" color="primary" v-on:click="close(true)">сохранить</v-btn>
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
                            <v-col></v-col>
                            <v-col cols="3">
                                <v-btn class="justify-end" variant="flat" size="small" append-icon="mdi-map" color="primary" @click="to_map(vc)">
                                    На карте
                                </v-btn>
                            </v-col>
                        </v-row>
                        <v-row v-if="duration">
                            <v-col>Общая протяженность за день: {{ Math.round(duration) }} км.</v-col>
                        </v-row>
                        <v-row v-if="timing">
                            <v-col>Всего на маршруте {{ Math.floor(timing / 60) }} час. {{ timing % 60}} мин.</v-col>
                        </v-row>
                        <v-dialog v-model="show" :close-on-content-click="false">
                            <v-card>
                                <v-toolbar color="primary">
                                    <v-avatar color="white" class="ml-8" border>{{ active_trip.num }}</v-avatar>
                                    <div class="ml-8">{{ format(active_trip.start) }} - {{ format(active_trip.end) }}</div>
                                </v-toolbar>
                                <v-data-table-virtual density="comfortable" fixed-header disable-sort
                                    :items="active_trip.stops"
                                    :headers="[
                                        {key:'pointname', title: 'Остановка'},
                                        {key: 'distance', title: 'Расстояние'},
                                        {key: 'start',    title: 'Прибытие'},
                                        {key: 'end',      title: 'Отправление'}
                                    ]">
                                    <template v-slot:item="{ item }">
                                        <tr>
                                            <td>{{ item.pointname }}</td>
                                            <td>{{ Math.round(item.distance*100)/100}} км</td>
                                            <td>{{format(item.start)}}</td>
                                            <td>{{format(item.end)}}</td>
                                        </tr>
                                    </template>
                                </v-data-table-virtual>
                            </v-card>
                        </v-dialog>
                    </v-card-subtitle>
                    <v-card-text>
                        <v-progress-linear color="primary" indeterminate v-if="busy"/>
                        <template v-if="schedules.length > 0">
                            <v-row class="flex-nowrap" no-gutters>
                                <v-col class="flex-grow-1 flex-shrink-0" v-for="(direction, i) in directions" :key="i">
                                    <div class="w-100 text-center text-h4 text-primary">{{ direction.direction }}</div>
                                    <v-sheet class="d-flex align-content-space-around flex-wrap" v-for="(interval, j) in intervals.value" :key="j" border>
                                        <span class="ma-2 pa-2 text-h4 text-decoration-underline text-grey cursor-pointer"
                                            v-for="(trip, t) in _schedules(direction, interval)" :key="t" @click="_on_schedule(trip)">
                                            {{ format(trip.start) }}
                                        </span>
                                    </v-sheet>
                                </v-col>
                            </v-row>
                        </template>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { profile } from 'jet-ext/composables/profile';
import { getRouteDirections, calcRouteScheduleN, saveSchedule } from '~/services/routes';
import useCore from '~/composables/core';
import RtxContractsTbl from "~/components/contracts/RtxContractsTbl";
import JetInputId from "jet-ext/components/form/editors/JetInputId";
import JetInputDate from "jet-ext/components/form/editors/JetInputDate";

const { load } = useCore();

const IDS = {
    ROUTES_URI    : 'sin2:/v:39e0099c-1747-45c5-9c61-bec8a790f2ae',
    FULLROUTES_URI: 'sin2:/v:63cb4030-8bd7-40c5-820e-e7613769a8cc',
    STOPS_URI     : 'sin2:/v:82afed8e-11c9-4ee5-8ac5-fe7f567531bf'
}
const routeID  = ref(null),
    startDt = ref(null),
    endDt = ref(null),
    trips = ref(10),
    interval = ref(10),
    form = ref(null),
    schedules = ref([]),
    busy = ref(false),
    intervals = ref({
        key: 'intervals',
        name: 'Интервалы движения',
        type: 'table',
        props: [
            {key: 'starttm', name: 'Начало', type: 'time', names: ['Начало']},
            {key: 'endtm', name: 'Окончание', type: 'time', names: ['Окончание']},
            {key: 'interval', name: 'Интервал', type: 'integer', names: ['Интервал']}
        ],
        value: [
            {starttm: null, endtm: null, interval: null}
        ],
        var: 10
    }),
    days = ref([
        {name:'Пн', active: false},
        {name:'Вт', active: false},
        {name:'Ср', active: false},
        {name:'Чт', active: false},
        {name:'Пт', active: false},
        {name:'Сб', active: false},
        {name:'Вс', active: false}
    ]),
    holiday = ref(false),
    show = ref(false),
    active_trip = ref(null);

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
    busy.value = true;
    schedules.value = await calcRouteScheduleN(routeID.value, intervals.value, directions.value);
    busy.value = false;
    console.log(schedules.value);
}

const _schedules = (direction, interval) => {
    return schedules.value
        .filter((s) => s.direction == direction.id && s.start >= interval.start && s.end <= interval.end)
        .sort((a, b) => a.num - b.num);
};

const _on_schedule = (trip) => {
    active_trip.value = trip;
    show.value = true;
};

const format = (v) => {
    const dt = $moment().format('YYYY-MM-DD');
    const h  = Math.floor(v/60);
    const m  = v % 60;
    return $moment(`${dt} ${h}:${m}`).format('HH:mm');
};

const timing = computed(() => {
    let result = 0;
    if ( !!schedules ) {
        schedules.value.forEach((v) => {
            result = result + (v.end - v.start);
        });
        return result;
    }
});

const duration = computed(() => {
    let result = 0;
    if ( !!schedules ) {
        schedules.value.forEach((v) => {
            v.stops.forEach((s) => {
                result = result + ( (!!s.distance) ? s.distance : 0 );
            });
        });
    }
    console.log(result);
    return result;
});

const close = async(save) => {
    const { valid } = await form.value.validate();
    if ( !valid ) {
        return;
    }
    const res = await saveSchedule({
        startDt  : startDt.value,
        endDt    : endDt.value,
        routeID  : routeID.value,
        holiday  : holiday.value,
        intervals: JSON.stringify(intervals.value),
        days     : JSON.stringify(days.value),
        schedules: JSON.stringify(schedules.value)
    });
}
</script>