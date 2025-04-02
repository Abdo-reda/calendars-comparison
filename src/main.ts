import "@/assets/styles/main.css";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import "floating-vue/dist/style.css";
import { createApp } from "vue";
import App from "./App.vue";
import { RecycleScroller } from "vue-virtual-scroller";
import FloatingVue from "floating-vue";

createApp(App)
    .component("RecycleScroller", RecycleScroller)
    .use(FloatingVue)
    .mount("#app");
