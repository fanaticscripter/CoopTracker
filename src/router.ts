import { nextTick } from 'vue';
import { createRouter, createWebHistory, RouteLocationNormalized } from 'vue-router';

import Home from '@/views/Home.vue';
import Coop from '@/views/Coop.vue';
import DevMode from '@/views/DevMode.vue';

declare module 'vue-router' {
  interface RouteMeta {
    title: string | ((route: RouteLocationNormalized) => string);
  }
}

const router = createRouter({
  routes: [
    {
      name: 'home',
      path: '/',
      component: Home,
      meta: {
        title: 'CoopTracker',
      },
    },
    {
      name: 'coop',
      path: '/:contractId/:coopCode/',
      component: Coop,
      props: true,
      meta: {
        title: route => {
          const contractId = route.params.contractId as string;
          const coopCode = route.params.coopCode as string;
          return `${coopCode}@${contractId} - CoopTracker`;
        },
      },
    },
    {
      name: 'devmode',
      path: '/devmode/',
      component: DevMode,
    },
    {
      path: '/:catchAll(.*)',
      redirect: '/',
    },
  ],
  history: createWebHistory(),
});

router.afterEach((to, from, failure) => {
  if (!failure) {
    nextTick(() => {
      const title = to.meta?.title;
      document.title = title instanceof Function ? title(to) : title;
    });
  }
});

export default router;
