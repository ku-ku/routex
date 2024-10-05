declare const $app: any;

const CONTRA_VALS_VIEW_ID = "a2063556-ab08-4c37-9d74-b0172fe0a7f4"; //trContractValues


export const indiParts = [{
    id:    'cost-max',
    code:  '',
    title: 'макс.стоимость',
    name:  '<b>Максимальная стоимость</b> работы транспортных средст i-го класса в i году'
}, {
    id:    'cost-net',
    code:  '',
    title: 'себестоимость',
    key  : 'CostTotal',
    name:  '<b>Расчет максимальной себестоимости</b> и 1 км пробега автобусов i-го класса в i год срока действия контракта',
}, {
    id:    'exp-other',
    code:  'п.15',
    title: 'прочие расходы',
    key  : 'CostOthers',
    name: '<b>Прочие расходы</b> по обычным видам деятельности в сумме с косвенными расходами для транспортных средств i-го класса в i году срока действия контракта'
}, {
    id:    'exp-to',
    code:  'п.11',
    title: 'ТО',
    key:   'CostRepair',
    name: '<b>Расходы на техническое обслуживание</b> и ремонт транспортных средств i-го класса в i году срока действия контракта в расчете на 1 км пробега'
}, {
    id:    'exp-parts',
    code:  'п.14',
    title: 'зап.части',
    key:   'CostParts',
    name: '<b>Расходы на запасные части</b> и материалы, используемые при техническом обслуживании и ремонте транспортных средств i-го класса в i год срока действия контракта в расчете на 1 км пробега'
}, {
    id:    'exp-slr-repairs',
    code:  'п.12,13',
    title: 'зпл АРМ',
    key:   'MechanicSalary',
    name:  '<b>Расходы на оплату труда</b> ремонтных рабочих с отчислениями на социальные нужды в расчете на 1 км пробега транспортных средств i-го класса в i год срока действия контракта'
}, {
    id:    'exp-ballons',
    code:  'п.10',
    title: 'затраты на шины',
    key:   'CostTires',
    name:  '<b>Расходы на износ и ремонт шин </b> транспортных средств i-го класса в t-ый год срока действия контракта в расчете на 1 км пробега'
}, {
    id:    'exp-fuel',
    code:  'п.8,9',
    title: 'топливо, смазочные',
    key:   'CostFuel',
    name:  '<b>Расходы на электроэнергию на движение </b> транспортных средств i-го класса в i год срока действия контракта в расчете на 1 км пробега'
}, {
    id:    'exp-slr-taxes',
    code:  'п.7',
    title: 'отчисления от зпл',
    key:   'SalaryTaxes',
    name:  '<b>Отчисления на социальные нужды </b>от оплаты труда водителей и кондукторов транспортных средств i-го класса в iг. Срока действия контракта в расчете на 1 км пробега'
}, {
    id:    'exp-slr-conds',
    code:  'п.5',
    title: 'зпл кондукторов',
    key:   'ConductorSalary',
    name:  '<b>Расходы на оплату труда кондукторов </b>транспортных средств i-го класса в i году срока действия контракта в расчете на 1 км пробега'
}, {
    id:    'exp-slr-drivers',
    code:  'п.2,3',
    title: 'зпл водителей',
    key:   'DriverSalary',
    name:  '<b>Расходы на оплату труда водителей </b>транспортных средств i-го класса в i году срока действия контракта в расчете на 1 км пробега'
}, {
    id:    'odometers',
    code:  '',
    title: 'пробег',
    key:   'Mileage',
    name:  '<b>Плановый пробег </b>с пассажирами на iг'
}, {
    id:    'moto-sheds',
    code:  'п.4',
    title: 'часы',
    key:   'TimeCount',
    name:  '<b>План часов на iг</b>'
}, {
    id:    'transport',
    code:  '',
    key  : "UnitsCount",
    title: 'количество единиц',
    name: '<b>Необходимое количество автобусов на iг</b>'
}, {
    id:    'transport-classes',
    code:  '',
    title: 'классы автобусов',
    name: ''
}, {
    id:    'avg-cost',
    code:  '',
    title: 'ср. цена',
    name: ''
}, {
    id:    'norms',
    code:  '',
    title: 'справочная информация',
    name: ''
}];


export async function getContraValues(contrId: string): Promise<any>{
    const data = await $app.rpc({
                        type: "core-read",
                        transform: true,
                        query: `sin2:/v:${ CONTRA_VALS_VIEW_ID }?filter=eq(field(".contractId"),param("${ contrId }", "id"))`
    });
    
    return data;
};  //getContracts

