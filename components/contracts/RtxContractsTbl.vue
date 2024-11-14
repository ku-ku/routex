<template>
    <v-form ref="form" class="rx-param"
            v-on:submit.stop.prevent="on_submit">
        <div class="rx-param__head">
            <div v-for="(col, i) in cols" :key="i" 
                 :style="{width: `calc(100% / ${ cols.length }`}">
                <template v-if="col.names">
                    <span v-for="a in col.names">{{ a }}</span>
                </template>
                <template v-else>
                    {{ col.name }}
                </template>    
            </div>
        </div>
        <div v-for="(v, i) in values" :key="i" class="rx-param__values">
            <div v-for="(col, j) in cols" :key="j" 
                 :style="{width: `calc(100% / ${ cols.length }`}">
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
                    :readonly="col.values||col.calc" />
                <v-text-field v-if="col.type !== 'id'"
                    variant="outlined" 
                    density="compact" 
                    hide-details 
                    class="contract_field"
                    v-model="values[i][col.key]"
                    :rules="rules"
                    :readonly="col.calc"/>
            </div>
        </div>
        <div class="rx-param__actions">
            <v-btn v-if="!item.source" variant="plain" density="comfortable" icon="mdi-plus-circle-outline" color="primary" @click="on_add" v-tooltip:bottom="'Добавить'"/>
            <v-btn v-if="!item.source" variant="plain" density="comfortable" icon="mdi-delete-circle-outline" color="primary" @click="on_del" v-tooltip:bottom="'Удалить'"/>
            <v-btn :disabled="!item.var" 
                   variant="plain" 
                   density="comfortable" 
                   icon="mdi-check-circle-outline" 
                   color="primary" 
                   type="submit"
                   v-tooltip:bottom="'Применить'" />
        </div>
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
        let props = item.value?.props||[];
        props.forEach( p => {
            if ( !(p.names?.length > 0) ){
                p.names = p.name.split(/\s+/);
            }
        });
        return props;
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
    const { valid } = await form.value.validate();
    if ( !valid )
        return;
    const v = {};
    cols.value.forEach( c => {
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
    const { valid } = await form.value.validate();
    if ( !valid )
        return;
    $emit('update:modelValue', values.value);
};

defineExpose({
    reset: ()=>{
        $emit('update:modelValue', []);
    }
});

</script>

<style lang="scss">
    .rx-param{
        display: block;
        overflow: auto;
        scrollbar-width: thin;
        height: auto;
        line-height: 1.115;
        &__head, 
        &__values,
        &__actions{
            font-size: 0.85rem;
            display: flex;
            flex: 1 1 100%;
            align-items: center;
            justify-content: flex-start;
            flex-wrap: nowrap;
            & > * {
                min-width: 5rem;
            }
        }
        
        &__head{
            margin: 0 0 0.5rem 0;
            align-items: flex-end;
            & span{
                display: inline-block;
                overflow: hidden;
                max-width: 100%;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin: 0;
                padding: 0;
                line-height: 1 !important;
                &:not(:last-child){
                    margin-right: 0.25rem;
                }
            }
        }
        
        &__actions{
            justify-content: flex-end;
            & > * {
                min-width: initial;
            }
        }
        
        & .contract_field {
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
    }
</style>