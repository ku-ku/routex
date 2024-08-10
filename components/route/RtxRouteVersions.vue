<template>
    <v-menu>
        <template v-slot:activator="{ props }">
            <v-btn size="small"
                   v-bind="props">{{ current?.code || '...' }}</v-btn>
        </template>
        <v-list v-if="vers?.length > 0" class="rtx-vers"
                v-model="current"
                density="compact">
            <v-list-item v-for="v in vers"
                         :value="v">
                <template v-slot:prepend>{{ v.code }}</template>
                <template v-slot:append>{{ format(v.regdt) }}</template>
                {{ v.name }}
            </v-list-item>
        </v-list>
    </v-menu>
</template>
<script setup lang="ts">
    import { toRef } from "vue";
    import { routeVersions } from "~/services/routes";
    
    declare const $moment: any;
    
    const props = defineProps({
        route: {
            type: Object,
            required: true
        }
    });
    
    const route: Ref<any> = toRef(props, "route"),
          current: Ref<any>= ref(null);
    
    const { pending, data: vers, error } = useAsyncData(async ()=>{
        current.value = null;
        const res = await routeVersions(route.value.id);
        console.log('vers', res);
        if ( res.length > 0 ){
            current.value = res.at(0);
        }
        return res;
    }, {
        watch: [ route ]
    });
    
    function format(dt: Date): string {
        return $moment(dt).format('DD.MM.YYYY');
    }
    
</script>
<style lang="scss">
    .rtx-vers{
        & .v-list-item{
            font-size: 0.85rem;
            &__append{
                margin-left: 1rem;
            }
            &__prepend{
                margin-right: 1rem;
            }
        }
    }
</style>