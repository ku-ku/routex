<template>
    <rtx-db-card icon="mdi-bus"
                 title="план">
        <v-list class="rtx-db__plans" 
                v-if="has('indics')"
                density="compact">
            <v-list-item title="">
                <template v-slot:title>
                    планируемый объем перевозок
                    <div class="text-muted">пассажиров</div>
                </template>
                <template v-slot:append>
                    <v-chip label>{{ indics.passamount }}</v-chip>
                </template>
            </v-list-item>
            <v-list-item title="планируемый пробег, км">
                <template v-slot:append>
                    <v-chip label>{{ indics.mileage }}</v-chip>
                </template>
            </v-list-item>
            <v-list-item title="планируемое время работы, ч">
                <template v-slot:append>
                    <v-chip label>{{ indics.hours }}</v-chip>
                </template>
            </v-list-item>
            <v-list-item title="планируемая потребность ТС">
                <template v-slot:append>
                    <v-chip label>{{ indics.vcamount }}</v-chip>
                </template>
            </v-list-item>
        </v-list>
    </rtx-db-card>
</template>
<script setup lang="ts">
    import RtxDbCard from "./RtxDbCard";
    import { default as all } from "~/composables/all";
    const indics:Ref<any> = computed(()=>all.indics?.plan?.at(0));
    
    function has(q:string): boolean{
        switch(q){
            case "indics":
                return !!indics.value;
        }
        return false;
    };
</script>
<style lang="scss">
    .rtx-db__plans{
        & .v-list-item{
            &:not(:last-child){
                border-bottom: 1px solid #ccc;
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