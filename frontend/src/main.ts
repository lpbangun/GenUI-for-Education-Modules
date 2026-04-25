import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import './style.css';
import App from './App.vue';
import ModuleView from './views/ModuleView.vue';
import DictionaryView from './views/DictionaryView.vue';
import AutoplayView from './views/AutoplayView.vue';
import HomeView from './views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/module/:concept_id', component: ModuleView, props: true },
    { path: '/dictionary', component: DictionaryView },
    { path: '/dictionary/:term', component: DictionaryView, props: true },
    { path: '/demo/autoplay', component: AutoplayView },
  ],
});

createApp(App).use(router).mount('#app');
