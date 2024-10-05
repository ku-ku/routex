declare const $app: any;

const NORMS_PARTS_VIEW_ID = 'aaf3211a-3d67-44bd-9f3a-aa04e1c4b4df';
const NORMS_VIEW_ID = 'c18ad0a7-3845-47d9-8142-0e0015b49aaf';           //trStandardValues

export async function getparts():Promise<Array<any>>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ NORMS_PARTS_VIEW_ID }?filter=and(
                                    lte(field(".startDt"),var("util.date.truncToDay(dateEnd)")),
                                    or(
                                            isnull(field(".endDt")),gte(field(".endDt"),var("util.date.truncToDay(dateBegin)"))
                                    )
                                &fields=.stCode,.stName
                                &sort=.stCode`
    });
    
    return data.sort( (d1: any, d2: any) => {
        return Number(d1.stCode) < Number(d2.stCode) ? -1 : 1;
    } );
};

export async function getnorms(partId: string):Promise<Array<any>>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ NORMS_VIEW_ID }?filter=eq(field(".stID"),param("${ partId }", "id"))
                        &sort=

                        )`
    });
    
    return data;
};  //getnorms