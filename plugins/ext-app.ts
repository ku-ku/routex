import jetApp from "jet-ext";
import { settings } from "jet-ext/composables/settings";
import { preauth, auth, get as getProfile} from "jet-ext/composables/profile";

declare const ym: any;

export default defineNuxtPlugin({
    async setup(nuxtApp) {

        window["$app"] = nuxtApp;

        const {public: config} = useRuntimeConfig();

        if (
            !/^(local)+/.test(window.location.host)
            && (config.YM_ID)
        ) {
            nuxtApp.YM_ID = config.YM_ID;

            // Yandex.Metrika counter 
            (function (m, e, t, r, i, k, a) {
                m[i] = m[i] || function () {
                    (m[i].a = m[i].a || []).push(arguments)
                };
                m[i].l = 1 * new Date();
                for (var j = 0; j < document.scripts.length; j++) {
                    if (document.scripts[j].src === r) {
                        return;
                    }
                }
                k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
            })
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            // https://tenchat.ru/media/1693056-chrome-i-firefox-nachali-blokirovat-schetchik-metriki-rassledovaniye-chast-1
            if (typeof window["ym"] !== "undefined") {
                ym(config.YM_ID, "init", {
                    clickmap: true,
                    trackLinks: true,
                    accurateTrackBounce: false,
                    webvisor: false
                });
                ym(config.YM_ID, 'notBounce');
            } else {
                console.log('No ym-counter loaded');
            }
            //Yandex.Metrika counter
        };

        nuxtApp.refresh = (q: string) => {
            refreshNuxtData(q);
        };

        /**
         * After read settins from IDB
         * -> preaut by saved token
         */
        nuxtApp.onsettings = ()=>{
            if ( !settings.local ){
                return;
            }


            //auth by saved token
            if (settings.local.tokens?.access){
                if ( !getProfile("has-subject") ){
                    preauth().then( async e => {
                        console.log('preauth', e);
                    }).catch( e => {
                        console.log('ERR (pre-auth)', e);
                    });
                }
            }
        };

        jetApp(nuxtApp);

    }
});