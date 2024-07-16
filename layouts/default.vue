<template>
    <v-app class="rtx">
        <NuxtLoadingIndicator />
        <v-main>
            <NuxtPage keepalive />
            <jet-msg />
        </v-main>
        <v-footer app>
            <v-spacer />
            <v-divider vertical />
            <v-btn size="x-small"
                   tile
                   variant="text"
                   :icon="has('user') ? 'mdi-account' : 'mdi-login'"
                   style="margin: -8px -16px -8px 0;"
                   v-on:click="doauth"></v-btn>
        </v-footer>
    </v-app>
    <teleport to="body">
        <rtx-auth ref="auth" />
    </teleport>
</template>
<script>
import { default as JetMsg }  from "jet-ext/components/JetMsg";
import { get as getProfile } from "jet-ext/composables/profile";
import RtxAuth from "~/components/Auth";
import { default as all }  from "~/composables/all";
    
export default{
    name: "defLayout",
    components: {
        JetMsg,
        RtxAuth
    },
    created(){
        $app.doauth = this.doauth;
    },
    methods: {
        has(q){
            switch(q){
                case "user":
                    return getProfile("has-subject");
                    break;
            }
            return false;
        },
        doauth(){
            this.$refs["auth"].open();
        }
    }
}    
</script>
<style lang="scss" scoped>
    .v-footer{
        font-size: 0.75rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>