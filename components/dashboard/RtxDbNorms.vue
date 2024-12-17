<template>
    <v-card class="rtx-db__norms"
            elevation="2">
        <v-card-text>
            <v-list>
                <v-list-item v-if="pending">
                    <v-skeleton-loader type="article"></v-skeleton-loader>
                </v-list-item>
                <template v-else>
                    <v-list-subheader>нормативные значения</v-list-subheader>
                    <v-list-item v-for="p in parts"
                                 :key="p.ID">
                        {{p.stCode }}.&nbsp;{{ p.stName }}
                        <template v-slot:append>
                            <span v-if="p.value">{{ fmtNum(p.value) }}</span>
                            <div class="text-muted" v-if="p.change">
                                {{ p.change.format("DD.MM.YYYY") }}
                            </div>
                        </template>
                    </v-list-item>
                </template>
            </v-list>
        </v-card-text>    
    </v-card>    
</template>
<script setup lang="ts">
    import { getparts,getnorms } from "~/services/norms";
    
    const { pending, data: parts, error } = useAsyncData("normatives", async ()=>{
        let n, parts = await getparts();
        let vals = await getnorms();
        console.log('norms', parts, vals);
        parts.forEach( p => {
            n = vals.findIndex( v => p.ID === v.trStandardValuesstID );
            if ( n > -1 ){
                p.change = $moment(vals[n].regDt);
                p.value  = vals[n].trStandardValuesstValue;
            }
        });
        return parts;
    });
    
    const _fmt = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2 });
    const fmtNum = (n:Number)=>{
        const _n = Number(n);
        return Number.isNaN(_n) ? n : _fmt.format(_n);
    };
    
</script>
<style lang="scss">
    .rtx-db__norms{
        .v-list-item{
            &:not(:last-child){
                border-bottom: 1px solid #ccc;
            }
            &__append{
                flex-flow: column;
                align-items: flex-end;
                text-align: right;
                margin-left: 0.5rem;
                font-weight: bold;
                font-size: 1rem;
                & .text-muted{
                    font-weight: normal;
                }
            }
        }
    }
</style>