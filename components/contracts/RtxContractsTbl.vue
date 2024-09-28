<template>
    <v-form ref="form">
        <div class="headline mb-4 text-primary">{{ item.name }}</div>
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
                    :items="item.value.props[j].items"
                    item-title="name"
                    item-value="id"
                    v-model="values[i][j].value"
                    @update:focused="on_input($event, j)"/>
                <v-text-field v-if="col.type !== 'id'"
                    variant="outlined" 
                    density="compact" 
                    hide-details 
                    class="contract_field"
                    v-model="values[i][j].value"
                    :rules="rules"

                    @update:focused="on_input($event, j)"/>
            </v-col>
        </v-row>
        <v-row class="justify-end">
            <v-btn variant="plain" density="comfortable" icon="mdi-plus-circle-outline" color="primary" @click="on_add" v-tooltip:bottom="'Добавить'"/>
            <v-btn variant="plain" density="comfortable" icon="mdi-delete-circle-outline" color="primary" @click="on_add" v-tooltip:bottom="'Удалить'"/>
            <v-btn variant="plain" density="comfortable" icon="mdi-check-circle-outline" color="primary" @click="on_submit" v-tooltip:bottom="'Применить'"/>
        </v-row>
    </v-form>
</template>

<script setup>
import useCore from '~/composables/core';
import { ref, toRef } from "vue";

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
});

const item = toRef(props.item),
    form = ref(null),
    rules = [
        v => !!v || 'Поле должно быть заполнено',
    ],
    cols = computed(() => {
        return item.value.value.props;
    }),
    cols_count = computed(() => {
        return item.value.value.props.length;
    }),
    values = ref(null),
    loading = ref(null);

const { load } = useCore();

onMounted(() => {
    values.value = item.value.value.value || [];
    if ( values.value.length == 0 ) {
        on_add();
    }
});

const on_input = async (event, i) => {
    if ( !event )
        return;
    if ( item.value.value.props[i].type !== 'id' )
        return;
    if ( item.value.value.props[i].items?.length > 0 )
        return;
    loading.value = true;
    try {
        const uri = 'sin2:/v:' + item.value.value.props[i].class;
        const res = await load({uri: uri});
        const keyCol = res.model.key;
        const titleCol = res.model.columns.filter(c => c.attributes.asName)[0].id.toLowerCase();
        const values = [];
        res.values.map((v) => {
            values.push({id: v[keyCol], name: v[titleCol]});
        });
        item.value.value.props[i].items = values;
    } catch(e) {
        console.log(e);
    } finally {
        loading.value = false;
    }
};

const on_add = async () => {
    const { valid } = await form.value.validate()
    if ( !valid )
        return;
    const v = [];
    cols.value.map((c) => {
        v.push({name: c.key, value: null})
    });
    values.value.push(v);
};

const on_submit = async () => {
    console.log(values);
    const { valid } = await form.value.validate()
    if ( !valid )
        return;
    //emit(null);
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