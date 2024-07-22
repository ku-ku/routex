<template>
    <v-dialog v-model="show"
              :max-width="1024">
        <v-toolbar density="compact"
                   color="primary">
            <v-toolbar-title>{{ title }}</v-toolbar-title>
            <v-spacer />
            <v-btn size="small"
                   icon="mdi-close"
                   tile
                   v-on:click="close(false)">
            </v-btn>
        </v-toolbar>
        <v-card tile
                :loading="loading">
            <v-card-text>
                <slot></slot>
            </v-card-text>
            <v-card-actions>
                <v-btn size="small"
                       variant="text"
                       prepend-icon="mdi-close"
                       v-on:click="close(false)">закрыть</v-btn>
                <v-btn size="small"
                       variant="elevated"
                       color="primary"
                       v-on:click="close(true)">сохранить</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
    const $emit = defineEmits(["update:modelValue", "save"]);
    
    const props=defineProps({
        title: {
            type: String,
            required: false,
            default: ""
        },
        loading: {
            type: Boolean,
            required: false,
            default: false
        },
        modelValue: {
            type: Boolean,
            required: true
        }
    });
    
    const title: Ref<string> = toRef(props, "title"),
          modelValue: Ref<boolean> = toRef(props, "modelValue");
    
    const show: Ref<boolean> = computed({
                get(){
                    return modelValue.value;
                },
                set(val){
                    $emit("update:modelValue", val);
                }
          });
          
    function close(save: boolean): void {
        if ( save ){
            $emit("save");
        }
        show.value = false;
    };
</script>