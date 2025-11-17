<script setup lang="ts">
import { getDirectusAssetURL } from '@@/server/utils/directus-utils';
import { watch, ref } from 'vue';
import type { DirectusImageProps } from '~/types/components';

const props = withDefaults(defineProps<DirectusImageProps>(), {
  width: undefined,
  height: undefined,
});

const src = ref(getDirectusAssetURL(props.uuid));

watch(
  () => props.uuid,
  (newUuid) => {
    src.value = getDirectusAssetURL(newUuid);
  }
);
</script>

<template>
  <img :src="src" v-bind="{ ...props, uuid: undefined }" />
</template>
