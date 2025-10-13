import { createRouter, createWebHistory } from "vue-router";

const baseRoutes = [
  {
    path: "/map",
    name: "map",
    component: () =>
      import(/* webpackChunkName: "map" */ "@/pages/map/index.vue"),
    meta: {
      index: 0,
    },
  },
];

const router = createRouter({
  history: createWebHistory("/"), // hash模式:createWebHashHistory，history模式:createWebHistory
  routes: [
    {
      path: "/",
      redirect: "/home",
    },
    {
      path: "/home",
      name: "home",
      component: () =>
        import(/* webpackChunkName: "home" */ "@/views/home/index.vue"),
      meta: {
        index: 0,
      },
    },
    ...baseRoutes,
  ],
});

export default router;
