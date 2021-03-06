<template>
  <div class="my-4 bg-white dark:bg-gray-800 shadow overflow-hidden ultrawide:rounded-lg">
    <div class="px-4 py-4 sm:px-6 bg-gray-50 dark:bg-gray-700">
      <div class="relative -ml-4 -mt-2 sm:flex items-start justify-between">
        <div class="flex-grow ml-4 mt-2">
          <h2 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            <img
              class="inline relative -top-px -left-1 -mr-1 h-6 w-6"
              :src="iconURL(eggIconPath(egg), 64)"
              v-tippy="{ content: eggTooltip(egg) }"
            />
            {{ contract.name }}
            (<base-click-to-copy
              :text="coopStatus.contractId"
              class="text-gray-900 dark:text-gray-100"
            />)
          </h2>
          <div class="flex items-center">
            <span class="flex items-center justify-center relative h-6 w-6 -left-1">
              <svg
                viewBox="0 0 640 512"
                class="h-3.5 relative top-px text-gray-400 dark:text-gray-300"
              >
                <path
                  fill="currentColor"
                  d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z"
                />
              </svg>
            </span>
            <base-click-to-copy
              :text="coopStatus.coopCode"
              class="pl-px text-sm text-gray-700 dark:text-gray-300 truncate"
              :style="{ maxWidth: 'min(20rem, 50vw)' }"
            />
            <template v-if="contract.minutesPerToken">
              <img :src="iconURL('egginc/b_icon_token.png', 64)" class="h-5 w-5 ml-1.5" />
              <span class="pl-px text-sm text-gray-700 dark:text-gray-300 truncate">
                {{ contract.minutesPerToken }}m
              </span>
            </template>
            <!-- public/private -->
            <svg
              class="h-4 w-4 text-gray-400 dark:text-gray-300 ml-1.5"
              viewBox="0 0 20 20"
              fill="currentColor"
              v-tippy="{ content: coopStatus.isPublic ? 'Public coop' : 'Private coop' }"
            >
              <template v-if="coopStatus.isPublic">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fill-rule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clip-rule="evenodd"
                />
              </template>
              <template v-else>
                <path
                  fill-rule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clip-rule="evenodd"
                />
                <path
                  d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                />
              </template>
            </svg>
          </div>
        </div>
        <coop-card-status-label :status="leagueStatus.completionStatus" />
        <div class="absolute right-0 bottom-0 sm:bottom-1">
          <last-refreshed :refreshTime="coopStatus.refreshTime" :style="{ maxWidth: '50vw' }" />
        </div>
      </div>
    </div>

    <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6 space-y-4">
      <dl class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ league }}</dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Created by</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            <template v-if="coopStatus.creator">
              <template v-if="devmode">
                <base-click-to-copy
                  :text="coopStatus.creator.id"
                  class="text-gray-900 dark:text-gray-100 truncate"
                >
                  {{ coopStatus.creator.name }}
                  <template #tooltip>Click to copy ID: {{ coopStatus.creator.id }}</template>
                </base-click-to-copy>
              </template>
              <template v-else>
                {{ coopStatus.creator.name }}
              </template>
            </template>
            <template v-else>
              <span v-tippy="{ content: 'The creator has left.' }" class="cursor-help"
                >&ndash;</span
              >
            </template>
          </dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Players</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {{ coopStatus.contributors.length }} / {{ contract.maxCoopSize }}
          </dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Eggs shipped</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            <span class="text-green-500">{{ formatEIValue(coopStatus.eggsLaid) }}</span> /
            {{ formatEIValue(leagueStatus.finalTarget, true) }}
          </dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Hourly production rate
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            <span :class="completionStatusColorClass(leagueStatus.completionStatus)">{{
              formatEIValue(coopStatus.eggsPerHour)
            }}</span>
            current / {{ formatEIValue(leagueStatus.requiredEggsPerHour) }} required
          </dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Time to complete</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            <span :class="completionStatusColorClass(leagueStatus.completionStatus)">{{
              formatDuration(leagueStatus.expectedTimeToComplete)
            }}</span>
            expected /
            <tippy class="text-gray-900 dark:text-gray-100">
              {{ formatDuration(max(coopStatus.secondsRemaining, 0)) }} remaining
              <template #content>
                {{ coopStatus.secondsRemaining > 0 ? 'Expires' : 'Expired' }} at
                {{ coopStatus.expirationTime.format('YYYY-MM-DD HH:mm') }}
              </template>
            </tippy>
          </dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Total earnings boost</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {{ (coopStatus.totalEarningsBoost * 100).toFixed(0) }}%
          </dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total egg laying rate boost
          </dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {{ (coopStatus.totalEggLayingRateBoost * 100).toFixed(0) }}%
          </dd>
        </div>
      </dl>

      <coop-card-progress-bar
        :eggsLaid="coopStatus.eggsLaid"
        :projectedEggsLaid="coopStatus.projectedEggsLaid"
        :leagueStatus="leagueStatus"
      />
    </div>

    <div class="flex flex-col">
      <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div class="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700">
            <coop-card-contribution-table :egg="egg" :coopStatus="coopStatus" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { Tippy } from 'vue-tippy';

import {
  CoopStatus,
  requestCoopStatus,
  eggIconPath,
  formatEIValue,
  formatDuration,
  ContractLeague,
} from '@/lib';
import { key } from '@/store';
import { completionStatusColorClass } from '@/styles';
import { devmodeKey } from '@/symbols';
import { eggTooltip, iconURL } from '@/utils';
import CoopCardStatusLabel from '@/components/CoopCardStatusLabel.vue';
import CoopCardProgressBar from '@/components/CoopCardProgressBar.vue';
import CoopCardContributionTable from '@/components/CoopCardContributionTable.vue';
import BaseClickToCopy from '@/components/BaseClickToCopy.vue';
import LastRefreshed from '@/components/LastRefreshed.vue';

export default defineComponent({
  components: {
    CoopCardStatusLabel,
    CoopCardProgressBar,
    CoopCardContributionTable,
    BaseClickToCopy,
    LastRefreshed,
    Tippy,
  },
  props: {
    contractId: {
      type: String,
      required: true,
    },
    coopCode: {
      type: String,
      required: true,
    },
  },
  emits: {
    success(payload: CoopStatus) {
      return true;
    },
  },
  // Note that this async component does NOT react to contractId and coopCode
  // changes. The component must be recreated on changes.
  async setup({ contractId, coopCode }, { emit }) {
    const store = useStore(key);
    const devmode = inject(devmodeKey);

    onMounted(() => {
      emit('success', coopStatus.value);
    });

    const getCoopStatus = async (existingStatus?: CoopStatus) => {
      const status = new CoopStatus(await requestCoopStatus(contractId, coopCode.toLowerCase()));
      await status.resolveContract({
        store: store.state.contracts.list,
        addToStore: contract => store.commit('contracts/addContract', contract),
        knownContract: existingStatus?.contract || undefined,
      });
      return status;
    };
    const coopStatus = ref(await getCoopStatus());

    const contract = computed(() => coopStatus.value.contract!);
    const egg = computed(() => contract.value.egg!);
    const league = computed(() => ContractLeague[coopStatus.value.league!]);
    const leagueStatus = computed(() => coopStatus.value.leagueStatus!);

    return {
      devmode,
      contract,
      egg,
      league,
      coopStatus,
      leagueStatus,
      formatEIValue,
      formatDuration,
      completionStatusColorClass,
      eggIconPath,
      eggTooltip,
      iconURL,
      max: Math.max,
    };
  },
});
</script>
