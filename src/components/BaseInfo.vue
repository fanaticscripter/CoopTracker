<template>
  <tippy>
    <svg
      class="inline h-4 w-4 cursor-pointer"
      :class="classes"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
        clip-rule="evenodd"
      />
    </svg>
    <template #content>
      <slot></slot>
    </template>
  </tippy>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Tippy } from 'vue-tippy';

export default defineComponent({
  components: {
    Tippy,
  },
  props: {
    classes: {
      type: String,
      default: 'text-gray-400',
    },
  },
  setup() {},
});
</script>
