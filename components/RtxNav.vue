<template>
    <v-list class="rtx-nav__list">
        <v-list-item v-if="has('user')">
            <template v-slot:prepend>
                <v-icon>mdi-account</v-icon>
            </template>
            <v-list-item-title class="text-h6">
                {{ user }}
            </v-list-item-title>
            <v-list-item-subtitle>
                {{ title }}
            </v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-else
                     v-on:click="doauth">
            <template v-slot:prepend>
                <v-icon>mdi-login</v-icon>
            </template>
            <v-list-item-title class="text-h6">
                Авторизация
            </v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item append-icon="mdi-chevron-right"
                     prepend-icon="mdi-map-marker-path"
                     title="Маршруты"
                     :disabled="!has('user')"
                     to="/routes">
        </v-list-item>
        <v-list-item append-icon="mdi-chevron-right"
                     prepend-icon="mdi-bus-clock"
                     title="Расписания"
                     :disabled="!has('user')">
        </v-list-item>
        <v-list-item append-icon="mdi-chevron-right"
                    prepend-icon="mdi-calendar"
                    title="Календарь"
                    :disabled="!has('user')"
                    to="/calendar">
        </v-list-item>
        <v-list-item append-icon="mdi-chevron-right"
                    prepend-icon="mdi-tune-vertical"
                    title="Настройки"
                    :disabled="!has('user')"
                    to="/settings">
        </v-list-item>
        <v-list-item append-icon="mdi-chevron-right"
                    prepend-icon="mdi-file-document-edit-outline"
                    title="Контракты"
                    :disabled="!has('user')"
                    to="/contracts">
        </v-list-item>
        <v-list-item append-icon="mdi-chevron-right"
                    prepend-icon="mdi-bus-clock"
                    title="Расчет расписания"
                    :disabled="!has('user')"
                    to="/schedules">
        </v-list-item>
    </v-list>
</template>
<script>
import { default as all }  from "~/composables/all";
import { get as getProfile }  from "jet-ext/composables/profile";
    
export default {
    name: 'RtxNav',
    computed: {
        title: ()=>getProfile("title"),
        user: ()=>getProfile("subject")?.name
    },
    methods: {
        has(q){
            switch(q){
                case "user":
                    return getProfile("has-subject");
            }
            return false;
        },
        doauth(){
            $app.doauth();
        }
    }
}    
</script>
<style lang="scss" scoped>
    .rtx-nav{
        &__list{
            max-width: 480px;
        }
    }
</style>