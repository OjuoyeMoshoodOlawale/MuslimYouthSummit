import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router/index.js';
import App from './App.vue';
import 'v-viewer/dist/v-viewer.css';
import VViewer from 'v-viewer';
import './assets/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(VViewer);

app.mount('#app');
