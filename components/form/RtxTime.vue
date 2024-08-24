<template>
    <v-text-field v-bind="$props"
                  variant="underlined"
                  density="compact"
                  ref="input"
                  :rules="rules"
                  v-model="text"
                  placeholder="hh:mm"
                  v-bind:class="{'jet-input': true, required: required}" />
</template>
<script setup lang="ts">
    import { ref, watch, onMounted } from "vue";
    import { Maskito } from '@maskito/core';
    import { maskitoTimeOptionsGenerator } from '@maskito/kit';
 
    const generator = maskitoTimeOptionsGenerator({ mode: 'HH:MM' });

    import { empty } from "jet-ext/utils";
    
    const $emit = defineEmits(["update:modelValue"]);
    
    const props = defineProps({
        required: {
            type: Boolean,
            required: false,
            default: false
        },
        modelValue: {
            type: [ Date, Number, Object],
            required: true,
            default: null
        }
    });
    
    const input = ref(null),
          modelValue = toRef(props, 'modelValue'),
          required = toRef(props, 'required'),
          time: Ref<Date> = ref( $moment([1900, 0, 1]).toDate() );
    
    const rules = ref([]);
    if ( required.value ){
        rules.value.push( val => !empty(val) || 'это поле должно быть заполнено');
    }
    
    function setime( t:Date|Number|Object|null ):void {
        let m = t ? $moment(t) : $moment([1900, 0, 1]);
        if ( m.isValid() ){
            time.value = m.toDate();
        }
    }
    
    watch(modelValue, (val:Date|Number|Object|null) => {
        setime(val);
    });
    
    const text = computed({
        get: ()=> {
            return $moment(time.value).format("HH:mm");
        },
        set: (val: string) => {
            try {
                let m = $moment(time.value).startOf('day');
                if ( !empty(val) ){
                    let times = val.split(/\:+/);
                    m.set('hours',   times.at(0)||0);
                    m.set('minutes', times.at(1)||0);
                    time.value = m.toDate();
                }
                $emit('update:modelValue', time.value);
            } catch(e: any){
                $emit('update:modelValue', val);
            }
        }
    });
    
    onMounted(()=>{
        const node = input.value.$el.querySelector("input");
        new Maskito(node, generator);
        setime($moment(modelValue.value));
    });
    
</script>