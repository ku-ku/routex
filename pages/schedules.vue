<template>
    <rtx-schedules-n />
</template>

<script setup>
import RtxSchedules from '~/components/schedules/RtxSchedules';
import RtxSchedulesN from '~/components/schedules/RtxSchedulesN';

definePageMeta({
    keepalive: false,
    name: 'schedulesPage'
});

</script>