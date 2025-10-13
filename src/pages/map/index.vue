<template>
    <div class="container">
        <TrafficRouteMap ref="TrafficRouteMapRef" 
            :orderRecordList="orderRecordList" 
            :warnRecordList="warnRecordList" 
            :stopRecordList="stopRecordList"
            :distance="distance"
            @getTrack="getTrack">
        </TrafficRouteMap>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import TrafficRouteMap from "./components/TrafficRouteMap.vue";
import { pathDataList } from "./data";

const orderRecordList: any = ref([]);
const warnRecordList: any = ref([]);
const stopRecordList: any = ref([]);
const distance: any = ref("");

const TrafficRouteMapRef: any = ref(null);

onMounted(() => {
    nextTick(() => {
        distance.value = 22
        orderRecordList.value = pathDataList
        TrafficRouteMapRef.value && TrafficRouteMapRef.value.getTrack(pathDataList, [], []);
    });
});

const getTrack = (val: any) => {
    console.log(2222);
};



</script>
<style lang="scss" scoped>
.container {
  height: 100vh;
}
</style>
