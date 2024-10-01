<template>
    <v-form ref="form">
        <v-row>
            <v-col v-for="(col, i) in cols" :key="i" :cols="12/cols" class="text-center text-caption">
                {{ col.name }}
            </v-col>
        </v-row>
        <v-row class="ma-0" v-for="(v, i) in values" :key="i">
            <v-col v-for="(col, j) in cols" :key="j" :cols="12/cols" class="text-center text-caption pa-0">
                <v-autocomplete v-if="col.type == 'id'"
                    variant="outlined" 
                    density="compact" 
                    hide-details 
                    class="contract_field"
                    :rules="rules"
                    :loading="loading"
                    :items="item.props[j].items"
                    item-title="name"
                    item-value="id"
                    v-model="values[i][col.key]"
                    :readonly="col.values"/>
                <v-text-field v-if="col.type !== 'id'"
                    variant="outlined" 
                    density="compact" 
                    hide-details 
                    class="contract_field"
                    v-model="values[i][col.key]"
                    :rules="rules"
                    :readonly="col.calc"/>
            </v-col>
        </v-row>
        <v-row class="justify-end">
            <v-btn v-if="!item.source" variant="plain" density="comfortable" icon="mdi-plus-circle-outline" color="primary" @click="on_add" v-tooltip:bottom="'Добавить'"/>
            <v-btn v-if="!item.source" variant="plain" density="comfortable" icon="mdi-delete-circle-outline" color="primary" @click="on_del" v-tooltip:bottom="'Удалить'"/>
            <v-btn :disabled="!item.var" variant="plain" density="comfortable" icon="mdi-check-circle-outline" color="primary" @click="on_submit" v-tooltip:bottom="'Применить'"/>
        </v-row>
    </v-form>
</template>

<script setup>
import useCore from '~/composables/core';
import { ref, toRef, watch } from "vue";

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
});

const $emit = defineEmits(["update:modelValue"]);

const item = toRef(props.item),
    form = ref(null),
    rules = [
        v => !!v || 'Поле должно быть заполнено',
    ],
    cols = computed(() => {
        return item.value.props;
    }),
    cols_count = computed(() => {
        return item.value.props.length;
    }),
    values = computed(() => {
        return item.value.value;
    }),
    loading = ref(null),
    selected = ref(null);

const { load } = useCore();

const on_add = async () => {
    const { valid } = await form.value.validate()
    if ( !valid )
        return;
    const v = {};
    cols.value.map((c) => {
        v[c.key] = null;
    });
    values.value.push(v);
};

const on_del = () => {
    if ( selected.value > 0 ) {
        values.value.splice(selected.value, 1);
    }
};

const on_submit = async () => {
    const { valid } = await form.value.validate()
    if ( !valid )
        return;
    $emit('update:modelValue', values.value);
};

</script>

<style lang="scss">
.contract_field {
    & .v-field {
        font-size: .75rem;
        border-radius: 0;
    }
    & .v-field__input {
        padding: 4px;
        min-height: 24px!important;
        & .v-autocomplete__selection {
            height: 18px;
        }
    }
    & .v-input__control {
        min-height: 26px!important;
    }
}
</style>