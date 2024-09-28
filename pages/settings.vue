<template>
    <v-container fluid>
        <v-toolbar color="transparent" density="compact">
            <v-toolbar-items>
                <v-menu transition="scale-transition">
                    <template v-slot:activator="{ props }">
                        <v-btn variant="tonal" color="primary" v-bind="props" rounded="xl"
                            :append-icon="(props) ? 'mdi-chevron-up' : 'mdi-chevron-down'">
                            {{ REFS.active.title }}
                        </v-btn>
                    </template>
                    <v-list density="compact" nav>
                        <v-list-item v-for="item in REFS.items" :key="item.id" :value="item.id">
                            <v-list-item-title @click="REFS.activate(item)">{{ item.title }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </v-toolbar-items>
        </v-toolbar>
        <v-container fluid>
            <v-data-table v-if="model?.type=='table'"
                :headers="model.headers"
                :items="values"/>
            <rtx-form v-if="model?.type == 'form'"
                :model="model"
                :values="values"/>
        </v-container>
    </v-container>
</template>

<script setup>
import useCore from '~/composables/core';
import { profile } from 'jet-ext/composables/profile';
import RtxForm from '~/components/form/RtxForm';

definePageMeta({
    keepalive: false,
    name: 'settingsPage'
});

const { load } = useCore();

const tenant = profile.tenant.id;

const REFS = {
    items: [
        {id: 'tenant', title: 'Профиль', uri:`sin2:/v:36f47f06-d3ed-480b-9789-f5ea38ba38f0?id=${tenant}`},
        {id: 'users' , title: 'Пользователи', uri: 'sin2:/v:0fbc3a3d-4e67-4be9-a6d6-5a865d0a776c'},
        {id: 'seasons', title: 'Сезонность', uri: 'sin2:/v:7b914094-5d1d-41d6-9610-e1c13c64b454'},
        {id: 'carriers', title: 'Перевозчики', uri: 'sin2:/v:0cd1bd05-69bd-401e-a77a-c13d509db479'},
        {id: 'wkmodes', title: 'Режимы работы', uri: 'sin2:/v:cdd23ed9-fea5-40b7-b344-9a1cc3b40956'},
    ],
    active: {id: 'tenant', title: 'Профиль', uri:`sin2:/v:36f47f06-d3ed-480b-9789-f5ea38ba38f0?id=${tenant}`},
    activate: (v) => {
        REFS.active = v;
        refreshNuxtData('settings');
    }
};
const model  = ref({});
const values = ref([]);

const { pending, error } = useAsyncData( 'settings', async() => {
    if ( !REFS.active ) {
        return;
    }
    const res = await load(REFS.active);
    model.value = res.model;
    values.value = res.values;
}, {
    watch: [REFS.active]
});
</script>