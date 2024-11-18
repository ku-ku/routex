<template>
    <v-dialog persistent v-model="show" max-width="600">
        <v-card prepend-icon="mdi-tune" title="Выберите опции">
            <v-divider class="mt-3"></v-divider>
            <v-card-text class="px-4">
                <v-list dense>
                    <v-list-item v-for="(item, i) in model.items" :key="i">
                        <template v-slot:prepend>
                            <v-checkbox v-model="item.use" color="primary" hide-details />
                        </template>
                        <template v-slot:append>
                            <v-icon size="small" v-if="item.successed == true" icon="mdi-check-circle-outline" color="green"/>
                            <v-icon size="small" v-if="item.successed == false" icon="mdi-close-circle-outline" color="red"/>
                        </template>
                        <div class="ml-4">{{ item.name }}</div>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn size="small"
                       variant="text"
                       prepend-icon="mdi-close"
                       @click="show=false"
                       text="закрыть"/>
                <v-btn size="small"
                       variant="elevated"
                       color="primary"
                       :loading="loading"
                       @click="_sync()"
                       text="сохранить"/>
          </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { model } from '~/composables/sync';

const show = ref(false),
    loading = ref(false);

const open = () => {
    model.clear();
    show.value = true;
};

const _sync = async () => {
    loading.value = true;
    await model.sync();
    loading.value = false;
}

defineExpose({
    open
});

</script>