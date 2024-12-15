<template>
    <rtx-db-card icon="mdi-highway"
                 title="маршруты"
                 ref="main">
        <v-list v-if="has('indics')"
                density="compact"
                class="rtx-db__routes">
            <v-list-item title="количество">
                <template v-slot:append>
                    <v-chip label>{{ indics.routescount }}</v-chip>
                </template>
            </v-list-item>
            <v-list-item title="общая протяженность, км">
                <template v-slot:append>
                    <v-chip label>{{ indics.routeslength }}</v-chip>
                </template>
            </v-list-item>
            <template v-if="has('lasts')">
                <v-list-subheader>последние изменения</v-list-subheader>
                <v-list-item v-for="r in indics.lastchanges"
                    :key="'route-' + r.routecode">
                    <template v-slot:prepend>
                        {{ r.routecode }}
                    </template>
                    <template v-slot:title>
                        {{ r.routename }}
                        <div class="last-dt">
                            {{ get("date", r.lastdate) }}
                        </div>    
                    </template>    
                </v-list-item>
            </template>    
        </v-list>
    </rtx-db-card>
</template>
<script setup lang="ts">
    import { default as all } from "~/composables/all";
    import RtxDbCard from "./RtxDbCard";
    
    const indics:Ref<any> = computed(()=>all.indics);
    
    function has(q:string): boolean{
        switch(q){
            case "indics":
                return !!indics.value;
            case "lasts":
                return indics.value?.lastchanges?.length > 0;
        }
        return false;
    };  //has
    
    function get(q:string, val:any): string{
        switch(q){
            case "date":
                return $moment(val).format("DD.MM.YYYY HH:mm");
        }
    }   //get
</script>
<style lang="scss">
    .rtx-db__routes{
        & .v-list-item{
            & .last-dt{
                font-size: 0.6rem;
                color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
            }
            &:not(:last-child){
                border-bottom: 1px solid #ccc;
            }
            &__prepend{
                margin-right: 0.5rem;
            }
            &__append{
                text-align: right;
                margin-left: 0.5rem;
                font-weight: bold;
                font-size: 1rem;
            }
        }
    }
</style>