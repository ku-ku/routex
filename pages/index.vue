<template>
    <v-toolbar app>
        <v-btn :icon="has('user') ? 'mdi-menu' : 'mdi-account-cancel'"
               v-on:click="nav = !nav"></v-btn>
        <rtx-searcher v-if="has('user')" 
                      flat 
                      :absolute="false" />
    </v-toolbar>
    <v-navigation-drawer
       color="grey-darken-2"
       temporary
       v-model="nav">
        <rtx-nav />
    </v-navigation-drawer>
    <v-container class="rtx-main">
        <template  v-if="has('user')">
            <h2>{{ title }}</h2>
            <div class="rtx-main__indics">
                <rtx-db-routes />
                <rtx-db-tarifs />
                <rtx-db-plans />
                <rtx-db-costs />
            </div>    
        </template>    
    </v-container>
</template>
<script setup lang="ts">
import { settings } from "jet-ext/composables/settings";
import { get as getProfile }  from "jet-ext/composables/profile";
import { empty } from "jet-ext/utils";
import { default as all } from "~/composables/all";

import RtxNav from "~/components/RtxNav";
import RtxDbTarifs from "~/components/dashboard/RtxDbTarifs";
import RtxDbRoutes from "~/components/dashboard/RtxDbRoutes";
import RtxDbPlans from "~/components/dashboard/RtxDbPlans";
import RtxDbCosts from "~/components/dashboard/RtxDbCosts";

const nav: Ref<boolean> = ref(false),
      title: Ref<string>= computed(()=> getProfile("title"));



definePageMeta({
    name: 'indexPage'
});

function has(q: string): boolean{
    switch(q){
        case "user":
            return getProfile("has-subject");
    }
    return false;
};

</script>
<style lang="scss">
    .rtx-main{
        &__indics{
            display: flex;
            flex: 1 1 100%;
            flex-wrap: wrap;
        }
        h2 {
            margin: 2rem 0 1rem;
            font-weight: 500;
        }
    }
</style>
