import { load as _load } from '~/services/core';

const model = reactive([]);

export default function useOrm() {

    const load = async(item) => {
        const result = await _load(item.uri);
        if ( !result ) {
            $app.msg({text: 'Ошибка получения данных', color: 'warning'});
        }
        if ( result.error ) {
            $app.msg({text: result.error.data, color: 'warning'});
        }
        //item.model = find(item.uri);
        item.model = model.find( (m) => item.uri.indexOf(`sin2:/v:${m.id}`) == 0 );
        if ( !item.model ) {
            item.model = _model(result.result.model);
            model.push(item.model);
        }
        item.values = _data(result.result);
        return item;
    }

    const _model = (data) => {
        const result = {};
        try {
            result.id = data.viewId;
        
            data.projects.map( async (p) => {
                if ( p.projectType == 'typeView' )
                    result.type = ( p.name.indexOf('table') > 0 ) ? 'table' : 
                        ( p.name.indexOf('form') > 0 ) ? 'form' : null;
                if ( p.projectType == 'typeViewHtml' || p.projectType == 'typeHtmlView' ) {
                    result.meta = await $app.api(`/static/model/view/${p.lobRef.target.data.id}`);
                    if ( result.type == 'form' ) {
                        result.form = _template(result.meta.form);
                    }
                }
            });
            result.columns = data.columns;
            result.key = data.idColumnId.toLowerCase();
            if ( result.type == 'table' ) {
                const headers = [];
                const cols = result.columns.sort((a, b) => a.weight - b.weight);
                cols.map((col) => {
                    if ( !col.attributes.hiddenInTable ) {
                        const header = col.title;
                        if ( header.indexOf(':') > 0 ) {
                            const main_header = header.substring(0, header.indexOf(':'));
                            header = header.substring(header.indexOf(':') + 1);
                            if ( !headers.find((h) => h.value == main_header) ) {
                                headers.push({title: main_header, align: 'center', children: []});
                            }
                            headers.find((h) => h.value == main_header).children.push({title: header, value: col.id.toLowerCase()});
                        } else {
                            headers.push({title: header, value: col.id.toLowerCase()});
                        }
                    }
                });
                result.headers = headers;
            }
        } catch (e) {
            throw {message: 'Error load view model: ' + e};
        }
        return result;
    }

    const _template = (data) => {
        const template = {
            tabs: []
        };
        try {
            const _node = (node, root) => {
                while ( node.parentNode ) {
                    if ( node.parentNode.localName == root.localName && node.parentNode !== root ) {
                        return false;
                    }
                    if ( node.parentNode.localName == root.localName && node.parentNode == root ) {
                        return true;
                    }
                    return _node(node.parentNode, root);
                }
            }
            const form = data.substring(data.indexOf('<v-form'), data.indexOf('</v-form>') + '</v-form>'.length);
            const doc  = new DOMParser().parseFromString(form, 'text/html');
            doc.querySelectorAll('v-tab').forEach((node) => {
                const tab = {};
                tab.value = node.attributes['key'].value;
                tab.title = node.innerHTML;

                doc.querySelectorAll('v-tab-item').forEach((t) => {
                    if ( t.attributes['key'].value == tab.value ) {
                        tab.rows = [];
                        t.querySelectorAll('v-layout').forEach((r) => {
                            if ( _node(r, t) ) {
                                const cols = [];
                                r.querySelectorAll('v-flex').forEach((f) => {
                                    if ( _node(f, r) ) {
                                        const field = {};
                                        f.attributes.forEach((a) => {
                                            if ( a.name.startsWith('offset') ) {
                                                field.offset = a.name.replace(/\D/g, "");
                                            } else {
                                                field.width = a.name.replace(/\D/g, "");
                                            }
                                        });
                                        if ( f.children[0].localName == 'jet-input') {
                                            f.children[0].attributes.forEach((a) => {
                                                const attr = a.name.replace(':', '');
                                                switch ( attr ) {
                                                    case 'visible':
                                                    case 'disabled':
                                                    case 'required':
                                                        field[attr] = (a.value == 'false') ? false : true;
                                                        break;
                                                    case 'ref':
                                                    case 'v-model':
                                                        let idx = -1;
                                                        a.value.split('').map((c, i) => {
                                                            if ( c.toUpperCase() == c ) {
                                                                idx = i;
                                                                return;
                                                            }
                                                        });
                                                        if ( idx >= 0 ) {
                                                            field[attr] = a.value.substring(0, idx).toLowerCase() + '.' + a.value.substring(idx).toLowerCase();
                                                        }
                                                        break;
                                                    default:        
                                                        field[attr] = a.value;
                                                }
                                            });
                                        }
                                        cols.push(field);
                                    }
                                });
                                tab.rows.push(cols);
                            }
                        });        
                    }
                });
                template.tabs.push(tab);
            });
            return template;
        } catch(e) {
            console.log(e);
        }
    }

    const _data = (data) => {
        const result = [];
        try {
            const ci = data.columnIndexes;
            data.data.map((values) => {
                const item = {};
                Object.keys(ci).map((c) => {
                    item[c] = values[ci[c]];
                });
                result.push(item);
            });
        } catch (e) {
            throw {message: 'Error load view data: ' + e};
        }
        return result;
    }

    return {
        load
    }
}