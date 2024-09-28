<template>
    <v-form ref="form" class="jet-form">
        <v-card>
            <v-tabs v-model="tab" color="primary">
                <v-tab v-for="(t, i) in model.form?.tabs" :value="i" :key="i"> {{ t.title }}</v-tab>
            </v-tabs>
            <v-card-text>
                <v-window v-model="tab">
                    <v-window-item v-for="(t, i) in model.form?.tabs" :value="i" :key="i">
                        <template v-for="(row, j) in t.rows" :key="j">
                            <v-row dense>
                                <v-col v-for="n in row.length" :key="n" :cols="row[n-1].width">
                                    <jet-input-id v-if="row[n-1].type == 'id'" :uri="row[n-1].uri" :class="classes(row[n-1])"
                                        :type="row[n-1].type" :name="row[n-1].ref" v-model="values[row[n-1].ref]" :label="row[n-1].label" :required="row[n-1].required" />
                                    <jet-input-number v-if="row[n-1].type == 'integer' || row[n-1].type == 'float'" :class="classes(row[n-1])"
                                        :type="row[n-1].type" :name="row[n-1].ref" v-model="values[row[n-1].ref]" :label="row[n-1].label" :required="row[n-1].required" />
                                    <jet-input-string v-if="row[n-1].type == 'string'" :class="classes(row[n-1])"
                                        :type="row[n-1].type" :name="row[n-1].ref" v-model="values[row[n-1].ref]" :label="row[n-1].label" :required="row[n-1].required" />
                                    <jet-input-date v-if="row[n-1].type == 'date' || row[n-1].type == 'datetime'" :class="classes(row[n-1])"
                                        :type="row[n-1].type" :name="row[n-1].ref" v-model="values[row[n-1].ref]" :label="row[n-1].label" :required="row[n-1].required" />
                                    <jet-input-boolean v-if="row[n-1].type == 'boolean'" :class="classes(row[n-1])"
                                        :type="row[n-1].type" :name="row[n-1].ref" v-model="values[row[n-1].ref]" :label="row[n-1].label" :required="row[n-1].required" />
                                </v-col>
                            </v-row>
                        </template>
                    </v-window-item>
                </v-window>

            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="outlined" color="grey-darken-2">Отмена</v-btn>
                <v-btn variant="outlined" color="primary">Сохранить</v-btn>
            </v-card-actions>
        </v-card>
    </v-form>
</template>

<script setup>
import { ref, toRef } from "vue";

import JetInputDate from "jet-ext/components/form/editors/JetInputDate";
import JetInputId from "jet-ext/components/form/editors/JetInputId";
import JetInputNumber from "jet-ext/components/form/editors/JetInputNumber";
import JetInputBoolean from "jet-ext/components/form/editors/JetInputBoolean";
import JetInputString from "jet-ext/components/form/editors/JetInputString";

const props = defineProps({
    values: {
        type: Object,
        required: true
    },
    model: {
        type: Object,
        required: true
    }
});

const tab  = ref(0),
    model  = toRef(props.model),
    values = toRef(props.values[0]);

const classes = (field) => {
    let result = '';
    if ( field.visible == false ) {
        result = result + ' d-none';
    }
    return result;
}

console.log(model);
console.log(values);
</script>