<template>
  <view>
    <router-view></router-view>
    <beian-footer></beian-footer>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

const xToken = ref<string | null>(null);
const StatusBar = ref<number>(0);
const CustomBar = ref<number>(0);
const Custom = ref<any>(null);
onLaunch(() => {});
onShow(() => {});
onHide(() => {});
</script>

<style>
/* Ensure content isn't hidden behind the footer */
page {
  padding-bottom: 40px;
}
</style>
