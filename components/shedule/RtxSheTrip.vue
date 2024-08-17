<template>
    <v-card class="rtx-trip">
        <v-toolbar density="compact">
            <v-chip label pill>
                <template v-slot:prepend>
                    <v-badge inline :content="trip.n + 1" color="yellow-lighten-5"></v-badge>
                </template>
                {{ trip.trip }}
            </v-chip>
            <div class="rtx-trip__times">
                {{ trip.openedAt.format("HH:mm")}}&nbsp;-
                {{ trip.closedAt.format("HH:mm")}}
                <div class="text-muted"><v-icon size="small">mdi-clock-outline</v-icon>
                    в пути {{ 
                    (trip.time > 60) ? Math.trunc(trip.time/60) + ' ч. ' + (trip.time - (Math.trunc(trip.time/60 )*60)) + ' мин.' : trip.time + ' мин.'
                }}</div>
            </div>
            <template v-slot:append>
                <v-menu>
                    <template v-slot:activator="{ props }">
                        <v-btn size="small" icon="mdi-dots-vertical"
                               tile 
                               v-bind="props"></v-btn>
                    </template>
                    <v-list>
                        <v-list-item prepend-icon="mdi-calendar-sync">
                            Пересчитать рейс...
                        </v-list-item>
                        <v-divider />
                        <v-list-item prepend-icon="mdi-close">
                            Удалить рейс
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>
        </v-toolbar>
        <v-card-text>
            <v-list density="compact">
                <v-list-item v-for="(s, n) in trip.stops"
                             v-on:click="$emit('click', s)"
                             v-bind:class="{'rtx-trip__stop': true, 'ended': s.ended}">
                    <template v-slot:prepend>
                        <v-badge inline :content="s.stopTime" 
                                 :class="{'no-data': !(s.stopTime > 0)}"
                                 color="yellow-lighten-5">
                            <div class="text-muted mr-2">
                                {{ s.depTime.format("DD") }}
                            </div>
                            {{ s.arrTime.format("HH:mm") }}
                            <br />
                            {{ s.depTime.format("HH:mm") }}
                        </v-badge>
                    </template>
                    <div class="rtx-trip__num">
                        {{ n + 1 }}
                    </div>
                    {{ s.name }}
                    <template v-slot:append>
                        <v-btn size="x-small" icon="mdi-close"
                               variant="text">
                        </v-btn>
                    </template>    
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
</template>
<script setup lang="ts">
    const props = defineProps({
        trip: {
            type: Object,
            required: true
        }
    });
    
    const trip = toRef(props, "trip");
    
    const $emit = defineEmits(["click"]);
    
</script>
<style lang="scss">
    .rtx-trip{
        width: 25rem;
        min-width: 25rem;
        & .v-toolbar {
            font-size: 0.9rem;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            & .v-chip {
                &__prepend{
                    margin-left: -8px;
                    margin-right: 8px;
                }
                &__content{
                    font-weight: 600;
                }
            }
        }
        &__stop{
            &.ended{
                font-weight: 600;
            }
        }
        &__times{
            margin-left: 1rem;
        }
        &__num{
            position: absolute;
            left: 4px;
            top: -10px;
            background: #fff;
            font-size: 0.75rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 2px 4px;
        }
        & .v-list{
            &-item{
                line-height: 1.125;
                &:not(:last-child){
                    border-bottom: 1px solid #ccc;
                }
                &__prepend{
                    margin-right: 1rem;
                    width: 5rem;
                    & .v-badge{
                        &.no-data{
                            & .v-badge__badge{
                                visibility: hidden;
                            }
                        }
                    }
                }
            }
        }
    }
</style>