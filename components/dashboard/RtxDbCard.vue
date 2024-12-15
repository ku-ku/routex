<template>
    <v-card :loading="pending">
        <v-card-title>
            <v-icon>{{ icon }}</v-icon>
            {{ title }}
        </v-card-title>
        <v-card-text>
            <slot />
        </v-card-text>
    </v-card>
</template>
<script setup lang="ts">
    import { default as all, getindics } from "~/composables/all";
    
    const props = defineProps<{
        icon: string,
        title: string
    }>();

    const { pending, data: indics, execute, error } = useAsyncData("indicators", async ()=>{
        
        let res = all.indics;
        
        if ( res ){
            return res;
        }
        
        all.indics = {loading: true};
                
        res = await getindics();
        return res;
    }, {
        dedupe: 'cancel',
        server: false
    });
    
</script>
<style lang="scss" scoped>
    .v-card{
        max-width: 33%;
        min-width: 240px;
        margin-right: 1rem;
        margin-bottom: 1rem;
        &-title{
            text-transform: uppercase;
            font-size: 1rem;
        }
        & .v-icon{
            margin-right: 1rem;
            border: 1px solid white;
            color: white;
            background: rgba(var(--v-theme-primary));
            padding: 4px;
            border-radius: 6px;
            box-shadow: 2px 2px 6px rgba(0,0,0, 0.18);
            opacity: 0.75;
            &:before{
                font-size: 18px;
            }
        }
    }
</style>