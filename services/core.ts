declare const $app: any;

export function audit(){}

export async function load(uri: string): Promise<any>{
    return $app.rpc({
        type: 'core-read',
        query: uri
    });
}