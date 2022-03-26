<script setup lang="ts">
import { useServiceSubscription } from "../src/index";
useServiceSubscription({ serverAlias: "api", servicePath: "users" })
</script>

<template>
  <div></div>
</template>