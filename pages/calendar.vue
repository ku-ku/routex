<template>
    <v-toolbar app>
        <v-btn tile icon="mdi-chevron-left"
               v-on:click="$router.go(-1)" />
        <v-divider vertical />
        <div class="rtx-calendar__period">
            <v-select :items="months"
                       density="compact"
                       hide-details
                       item-value="id"
                       :return-object="false"
                       v-model="month"
                       :max-width="220"
                       flat
                       variant="solo-filled"></v-select>
            <v-select :items="years"
                       density="compact"
                       hide-details
                       item-value="id"
                       :return-object="false"
                       v-model="yr"
                       :max-width="120"
                       flat
                       variant="solo-filled"></v-select>
        </div>
        {{ title }}
        <v-spacer />
        <v-btn :disable="!dirty"
               :variant="dirty ? 'elevated' : 'tonal'"
               :loading="pending"
               color="primary"
               v-on:click="save">сохранить</v-btn>
    </v-toolbar>
    <v-container class="rtx-calendar">
        <v-calendar title="Производственный календарь" 
                    view-mode="month"
                    :month="month"
                    :year="yr"
                    :events="events"
                    hide-header>
            <template v-slot:event="{ day, event }">
                <v-chip :color="event.color"
                        size="small"
                        prepend-avatar="icon='mdi-calendar-weekend'"
                        label
                        v-on:click="change(event.start)">
                    <template v-slot:prepend>
                        <v-icon v-if="!/^(рабоч)+/.test(event.title)">
                            {{ /^(выхо)+/.test(event.title) ? 'mdi-calendar-weekend' : 'mdi-flag' }}
                        </v-icon>
                    </template>
                    {{ event.title }}
                </v-chip>
            </template>
        </v-calendar>
    </v-container>
</template>
<script setup lang="ts">
    declare const $jet: any;
    declare const $moment: any;
    import { NULL_ID } from "jet-ext/utils";
    import { calendar } from "~/services/shedule";
    
    const d = new Date();
    let $m = $moment([d.getFullYear(), d.getMonth(), 1]);
    
    const days: Ref<any[]|null> = ref(null),
          years: Ref<number[]> = ref([]), 
          months: Ref<any[]> = ref([{id: 0, title: 'январь'}, 
                                {id: 1, title: 'февраль'},
                                {id: 2, title: 'март'},
                                {id: 3, title: 'апрель'},
                                {id: 4, title: 'май'},
                                {id: 5, title: 'июнь'},
                                {id: 6, title: 'июль'},
                                {id: 7, title: 'август'},
                                {id: 8, title: 'сентябрь'},
                                {id: 9, title: 'октябрь'},
                                {id: 10, title: 'ноябрь'},
                                {id: 11, title: 'декабрь'}
                            ]),
          month: Ref<number> = ref($m.get('month')),
          yr: Ref<number> = ref($m.get('year')),
          title: Ref<string> = computed(()=>{
              if ( !(days.value?.length > 0) ){
                  return 'n/a';
              }
              let n = 0;
              days.value.forEach( d => {
                  if ( d.red || d.weekend ){
                      n++;
                  }
              });
              return `дней (раб./вых.): ${ days.value.length - n } / ${ n }`;
          });
    
    for (let n = d.getFullYear() - 3; n < d.getFullYear() + 11; n++){
        years.value.push( n );
    }
    
    const events: Ref<any[]> = computed(()=>{
        if ( !days.value ){
            return [];
        }
        return days.value.map( ($d:any) => {
            return {
                title: !!$d.weekend ? 'выходной' : !!$d.red ? 'праздник' : 'рабочий',
                start: $d.d.toDate(),
                end:   $d.d.toDate(),
                color: !!$d.weekend ? 'blue-grey-darken-2' : !!$d.red ? 'red-accent-4' : 'primary',
                allDay: true
            }
        });
    });
    
    const dirty = computed(()=>{
        return days.value?.findIndex( d => !!d.dirty ) > -1;
    });
    
    const {pending, error} = useAsyncData("calendar", async ()=>{
        let n, r, res = await calendar(month.value, yr.value);
        let dirty  = (res.length === 0);
        console.log('calendar', res);
        $m = $moment([yr.value, month.value, 1]);
        while ( $m.month() === month.value ){
            if ( dirty ){
                res.push({ 
                            id: NULL_ID,
                            d: $m.clone(), 
                            weekend: ($m.day() === 0) || ($m.day() === 6), 
                            red: false, dirty: true
                        });
            } else {
                n = res.findIndex( r => $m.isSame(r.calDay, 'day') );
                r = ( n < 0 ) ? {id: NULL_ID} : {...res[n]};
                r.d = $m.clone();
                r.weekend = !!r.dayOff;
                r.red = !!r.Holiday;
                r.dirty = false;
                if ( n < 0 ){
                    res.push(r);
                } else {
                    res.splice(n, 1, r);
                }
            }
            
            $m = $m.add(1, "days");
        }
        days.value = res.filter( r => (typeof r.d !== "undefined") );
        
        console.log("days", days.value);
        
    }, {
        watch: [ month, yr ]
    });
    
    
    
    function change(dt: Date){
        var dt = $moment(dt);
        let d, n = days.value.findIndex( d => dt.isSame(d.d), 'day');
        if ( n > -1){
            d = days.value[n];
            d.dirty = true;
            if ( d.red ){
                d.red = false;
                d.weekend = false;
            } else if ( d.weekend ){
                d.red = true;
                d.weekend = false;
            } else {
                d.weekend = true;
            }
        }
    };  //change
    
    
    async function save(): void {
        const viewId = '6c274b47-6ef8-409c-9f6a-e0f813abec83';
        const rpc = {
                        type: "core-update",
                        query: `sin2:/v:${ viewId }`  ////trCalendar
                },
                all = [];
              
        const _save = async ($d: any): Promise<any> => {
            if ( $d.red || $d.weekend ) {
                rpc.type = ($d.id === NULL_ID) ? "core-create" : "core-update";
                rpc.params = [
                                {id: "calDay",  type: "date",     value: $d.d.toDate()},
                                {id: "Holiday", type: "boolean",  value: !!$d.red},
                                {id: "dayOff",  type: "boolean",  value: !!$d.weekend}
                    ];
                if ( $d.red ) {
                    rpc.params[2].value = false;    //reset weekend for red`s
                }
                if ( "core-update" === rpc.type ){
                    rpc.params.push({id: "id",  type: "id", value: $d.id});
                }
            } else if ($d.id !== NULL_ID) {
                rpc.type = "core-delete";
                rpc.params = [{id: "id", type: "id", value: $d.id}];
            }

            try {
                let res = await $app.rpc(rpc);
                if ( res.error ){
                    throw res.error;
                }
            } catch(e){
                console.log('ERR(save)', e);
                $app.msg({text: `Ошибка сохранения изменений за дату ${ $d.d.format("DD.MM.YYYY") }: ${e.message} ${e.data ||''}`, color: 'warning'});
            }
        };  //_save
        
        pending.value = true;
        try {
            days.value.filter( ($d:any) => $d.dirty ).forEach( ($d:any) => {
                all.push( _save($d) );
            });
            
            if ( all.length > 0 ){
                await Promise.all(all);
            }
            
        } finally {
            refreshNuxtData("calendar");
            pending.value = false;
        }
            
    }   //save
</script>
<style lang="scss">
    .rtx-calendar{
        &__period{
            display: flex;
            flex: 0 1 auto;
            flex-wrap: nowrap;
            padding: 1px;
            width: 340px;
            margin: 0 1rem;
            border-radius: 4px;
            border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
            & .v-field{
                border-radius: 0 !important;
            }
        }
        & .v-calendar{
            &-month__day{
                justify-content: space-around;
                min-height: 78px;
            }
            &-weekly__day{
                
                &-content{
                    align-self: center;
                }
                &-alldayevents-container{
                    text-align: center;
                }
            }
        }
    }
    
</style>
