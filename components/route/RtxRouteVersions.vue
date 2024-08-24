<template>
    <v-menu class="rtx-vers">
        <template v-slot:activator="{ props }">
            <v-btn size="small"
                   v-bind="props">v.&nbsp;{{ current?.code || '...' }}</v-btn>
        </template>
        <v-list v-if="vers?.length > 0"
                v-model="current"
                density="compact">
            <v-list-item v-for="v in vers"
                         :value="v">
                <template v-slot:prepend>{{ v.code }}</template>
                <template v-slot:append>{{ format(v.regdt) }}</template>
                {{ v.name }}
            </v-list-item>
            <template v-if="canAdd">
                <v-divider />
                <v-list-item v-on:click="$emit('newver')">
                    <template v-slot:append><v-icon size="small">mdi-plus</v-icon></template>
                    добавить версию трассы маршрута
                </v-list-item>
            </template>
        </v-list>
    </v-menu>
</template>
<script setup lang="ts">
    import { toRef } from "vue";
    import { routeVersions } from "~/services/routes";
    import type { MapRoute } from "~/services/types";
    
    declare const $moment: any;
    
    const props = defineProps({
        canAdd: {
            type: Boolean,
            required: false,
            default: false
        },
        route: {
            type: Object,
            required: true
        }
    });
    
    defineEmits(['newver']);
    
    const route:        Ref<MapRoute> = toRef(props, "route"),
          canAdd:       Ref<boolean> = toRef(props, "canAdd"),
          current:      Ref<any> = ref(null);
    
    const { pending, data: vers, error } = useAsyncData(async ()=>{
        current.value = null;
        const res = await routeVersions(route.value.id);
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
        & .v-btn{
            text-transform: lowercase !important;
        }
        & .v-list{
            &-item{
                font-size: 0.85rem;
                &__append{
                    margin-left: 1rem;
                }
                &__prepend{
                    margin-right: 1rem;
                }
            }
        }
    }
</style>