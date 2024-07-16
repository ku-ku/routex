<template>
    <v-dialog v-model="show"
              content-class="rtx-auth"
              :max-width="1024"
              :max-height="900">
        <v-toolbar density="compact"
                   :color="has('user') ? 'primary' : 'secondary'">
            <v-toolbar-title>{{ title }}</v-toolbar-title>
            <v-spacer />
            <v-btn tile icon="mdi-close"
                   v-on:click="show = false" />
        </v-toolbar>
        <v-layout class="py-10">
            <jet-auth-form closeable
                           v-on:auth="go(true)" 
                           v-on:logout="go(false)"
                           v-on:back="go(false)"/>
        </v-layout>    
    </v-dialog>
</template>
<script>
import JetAuthForm from "jet-ext/components/JetAuthForm";
import { settings } from "jet-ext/composables/settings";
import { profile, get as getProfile } from "jet-ext/composables/profile";

export default {
    components: {
        JetAuthForm
    },
    data(){
        return {
            show: false
        };
    },
    computed: {
        title(){
            if ( this.has("user") ){
                return getProfile("title");
            } 
            return "Авторизация";
        },
        names(){
            return settings.names;
        }
    },
    methods: {
        open(){
            this.show = true;
        },
        has(q){
            switch(q){
                case "user":
                    return getProfile("has-subject");
                    break;
            }
            return false;
        },
        go(q){
            if ( q ){
                this.$emit("success");
            }
            setTimeout(()=>{
                this.show = false;
            }, 666);
        }
    }
}
</script>    
<style lang="scss">
    .rtx-auth{
        & .v-layout{
            background: #fff;
        }
        & .jet-auth__conte {
            & .v-card{
                background-color: #fff;
            }
            & .v-row{
                min-height: unset !important;
            }
        }
    }
</style>