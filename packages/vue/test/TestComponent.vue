<script setup lang="ts">
import { useServiceSubscriptions } from "../src/index";
useServiceSubscriptions({ serverAlias: "api", servicePath: "users" })
</script>

<template>
  <div></div>
</template>