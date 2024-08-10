<template>
    <rtx-dialog :title="title"
                v-model="show"
                :loading="pending"
                v-on:save="save">
        <v-form ref="form" 
                v-on:submit.stop.prevent="save">
            <v-row dense>
                <v-col cols="6">
                    <jet-input-string v-model="stop.name"
                                      type="string"
                                      label="наименование"
                                      name="name"
                                      required />
                </v-col>
                <v-col cols="6">
                    <jet-input-id :uri="TYPES_VIEW_ID"
                                  type="id"
                                  name="typeID"
                                  v-model="stop.typeID"
                                  label="тип остановки" 
                                  required />
                </v-col>
            </v-row>
            <v-row dense>
                <v-col cols="6">
                    <jet-input-id :uri="TOWNS_VIEW_ID" 
                                  type="id"
                                  name="twnID"
                                  v-model="stop.twnID" 
                                  label="город / НП" 
                                  hint='используйте поиск для значения, например: "васю"' 
                                  required />
                </v-col>
            </v-row>    
            <v-row dense>
                <v-col cols="4">
                    <jet-input-date type="date"
                                    v-model="stop.startDt"
                                    name="startDt"
                                    label="дата регистрации" 
                                    required />
                </v-col>
                <v-col cols="4">
                    <jet-input-date type="date"
                                    v-model="stop.endDt"
                                    name="endDt"
                                    label="дата окончания" />
                </v-col>
            </v-row>
            <v-row dense>
                <v-col cols="4">
                    <jet-input-number type="float"
                                      v-model="stop.lat"
                                      name="lat"
                                      label="широта" 
                                      required />
                </v-col>
                <v-col cols="4">
                    <jet-input-number type="float"
                                      v-model="stop.lon"
                                      name="lon"
                                      label="долгота" 
                                      required />
                </v-col>
                <v-col cols="4">
                    <jet-input-number type="integer"
                                      v-model="stop.code"
                                      name="code"
                                      label="Код" />
                </v-col>
            </v-row>
            <v-row dense>
                <v-col cols="4">
                    <jet-input-number type="intenger"
                                      name="radius"
                                      v-model="stop.radius"
                                      label="радиус" />
                </v-col>
                <v-col cols="4">
                    <jet-input-boolean v-model="point.ended"
                                       name="ended"
                                       type="boolean"
                                       label="конечная" 
                                       v-on:update:modelValue="onended" />
                </v-col>
            </v-row>
            <v-row dense>
                <v-col cols="12">
                    <jet-input-string label="описание"
                                      type="string"
                                      name="description"
                                      v-model="stop.description" />
                </v-col>                      
            </v-row>    
        </v-form>
    </rtx-dialog>    
</template>
<script>
import RtxDialog from "../RtxDialog";
import { END_STOP_TYPE, stopInfo, savePoint, saveStop } from "~/services/stops";
import JetInputDate from "jet-ext/components/form/editors/JetInputDate";
import JetInputId from "jet-ext/components/form/editors/JetInputId";
import JetInputNumber from "jet-ext/components/form/editors/JetInputNumber";
import JetInputBoolean from "jet-ext/components/form/editors/JetInputBoolean";
import JetInputString from "jet-ext/components/form/editors/JetInputString";
import { empty } from "jet-ext/utils";
import { default as all } from "~/composables/all";

const TYPES_VIEW_ID   = "sin2:/v:4da874c6-6f68-4ed0-b0ab-7ff6ae494fba/?filter=field(\".isstop\")";
const TOWNS_VIEW_ID   = "sin2:/v:5ae27f7f-bf85-416e-8efd-94e93ca737ce";

const POINT_EMPTY = {
    id: null,
    index: -1,              //calc
    routeID: null,
    lat: 0,
    lon: 0,
    stop: true,
    name: null,
    ended: false,
    radius: 100,
    locationID: null,
    /*from location field`s*/
    code: 0,
    twnID: null,
    typeID: null,
    startDt: null,
    endDt: null,
    description: null
};

export default {
    name: 'RtxStopForm',
    emits: ['stop'],
    components: {
        JetInputDate,
        JetInputId,
        JetInputNumber,
        JetInputBoolean,
        JetInputString
    },
    data(){
        return {
            TYPES_VIEW_ID,
            TOWNS_VIEW_ID,
            show: false,
            pending: false,
            point: { ...POINT_EMPTY },
            stop:  { ...POINT_EMPTY }
        };
    },
    computed: {
        route(){
            return all.routes.active;
        },
        title(){
            if (this.route){
                return `${this.route.code}. ${this.route.name}<div class="text-muted">остановка маршрута</div>`;
            } 
            return '';
        }
    },
    methods: {
        onended(val){
            if ( val ){
                this.stop.typeID = END_STOP_TYPE;
            }
        },
        /**
         * @param {Object} point for editing | null (add)
         */
        async open(point){
            let id = point?.id;
            this.pending = true;
            try {
                if ( empty(id) ){
                    this.point = { ...POINT_EMPTY };
                    this.point.startDt = new Date();
                    this.point.routeID = this.route.id;
                    this.stop = { ...POINT_EMPTY };
                } else {
                    this.point = point;
                    this.stop  = await stopInfo(point.location?.id || point.locationID);
                }
                console.log('modify(point/stop)', this.point, this.stop);
                this.show = true;
            } catch(e){
                console.log('ERR(stop)', e);
                $app.msg({text: `Ошибка чтения данных ОП: ${ e.message }<br /> <small>${ e.data || ''}</small>`,
                         color: "warning"});
            } finally {
                this.pending = false;
            }
        },
        /**
         * Saving data to vcLocations & vcRoutePoints
         */
        async save(){
            let ok = await this.$refs["form"].validate();
            if (!ok){
                return false;
            }
            
            this.pending = true;
            try {
                let stop = await saveStop(this.stop);
                
                this.point.name = stop.name;
                this.point.locationID = stop.id;
                this.point.lat = stop.lat;
                this.point.lon = stop.lon;
                this.point.typeID  = stop.typeID;
                let point = await savePoint(this.point);
                point.location = stop;
                this.$emit('stop', point);
                this.show = false;
            } catch(e){
                console.log('ERR(save stop)', e);
                $app.msg({text: `Ошибка сохранения данных ОП: ${ e.message }<br /> <small>${ e.data || ''}</small>`,
                         color: "warning"});
            } finally {
                this.pending = false;
            }
            
            return false;
        }
    }
}
</script>
<style lang="scss">
</style>