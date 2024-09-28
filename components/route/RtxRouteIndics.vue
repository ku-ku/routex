<template>
    <rtx-dialog :title="title"
                v-model="show"
                :loading="pending"
                v-on:save="save">
        <component :is="comp" ref="indi" />
    </rtx-dialog>
</template>
<script setup lang="ts">
import RtxDialog from "../RtxDialog";
import RtxIndiClasses from "./indics/RtxIndiClasses";

const part = ref(null),
      route= ref(null),
      show = ref(false),
      indi = ref(null);

let comp = null;

const title = computed(()=>{
        let s = (part.value) ?  `${part.value.code} ${part.value.name || part.value.title}` : '';
        if (route.value){
            s += `<div class="text-muted">${ route.value.code || ''}. ${ route.value.name || ''}</div>`;
        }
        return s;
    }),
    pending = computed(()=> indi.value?.pending || false);

function open($route, $part): void{
    route.value = $route;
    part.value  = $part;
    switch (part.value.id){
        case 'transport-classes':
            comp = RtxIndiClasses;
            break;
    }
    show.value  = true;
};

function save(): void{
    
};

defineExpose({
    open
});

</script>