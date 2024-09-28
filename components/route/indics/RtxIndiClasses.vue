<template>
    <v-row v-for="c in vhClasses"
        :key="c.id">
               
    </v-row>
</template>
<script setup lang="ts">

const {error, pending, data: vhClasses} = useAsyncData("vh-classes", async ()=>{
    const opts = {
        type: "core-read",
        transform: true,
        query: `sin2:/v:cbed80d0-ca6d-461c-8747-7f868ba7d559?sort=.className`   //trVehicleClasses
    };
    const res = await $app.rpc(opts);
    console.log('classes', res);
    return res;
});

</script>