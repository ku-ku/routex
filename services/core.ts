declare const $app: any;

export function audit(){}

export async function load(uri: string): Promise<any>{
    return $app.rpc({
        type: 'core-read',
        query: uri
    });
}

export async function load_query(uri: string, params: any): Promise<any> {
    return await $app.rpc({
        type: 'query',
        transform: true,
        query: uri,
        params: params
    });

}