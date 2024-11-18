<template>
    <rtx-schedules />
</template>

<script setup>
import RtxSchedules from '~/components/schedules/RtxSchedules';

definePageMeta({
    keepalive: false,
    name: 'schedulesPage'
});

</script>