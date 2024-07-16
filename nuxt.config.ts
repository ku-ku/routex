import type { NuxtConfig } from 'nuxt/schema';
declare const defineNuxtConfig: any;

const isDev = (process.env.NODE_ENV === 'development');
const _HOST = 'http://192.168.61.244:8080';

  
const config: NuxtConfig = {
    devtools: { enabled: false },
    ssr: false,
    app: {
        head: {
            htmlAttrs: {
                lang: 'ru',
            },
            meta: [
                {charset: 'utf-8'},
                {name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no'},
                {hid: 'description', name: 'description', content: ''},
                {name: 'format-detection', content: 'telephone=no'},
            ],
            link: [
            ],
        },
    },
    css: [
        'vuetify/lib/styles/main.sass',
        'jet-ext/jet.scss'
    ],
    experimental: {
        asyncContext: false,
    },
    runtimeConfig: {
        public: {
            api: isDev ? '/api' : `${ _HOST }/api`,
            rpc: isDev ? '/rpc' : `${ _HOST }/rpc`,
            branding: isDev ? '/branding' : `${ _HOST }/branding`,
            static: isDev ? '/static/model/view/' : `${ _HOST }/static/model/view/`,
            channel: "routex",
            apiKey: Math.trunc(Math.random() * 10000000)
        }
    },
    build: {
        transpile: ['vuetify']
    },
    vite: {
        server: {
            fs: {
                allow: ['..']
            }
        }
    },
    nitro: {
        devProxy: {
            '/api/route-service/': {
                target: `http://router.project-osrm.org/route`,
                changeOrigin: true
            },
            '/api': {
                target: `${ _HOST }/api`,
                changeOrigin: true
            },
            '/publicApi': {
                target: `${ _HOST }/api/publicApi`,
                changeOrigin: true
            },
            '/rpc': {
                target: `${ _HOST }/rpc`,
                changeOrigin: true
            },
            '/branding': {
                target: `${ _HOST }/branding`,
                changeOrigin: true
            },
            '/static': {
                target: `${ _HOST }/static`,
                changeOrigin: true
            }
        }
    }
};

export default defineNuxtConfig(config);
