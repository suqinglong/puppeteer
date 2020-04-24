import { Trim } from './index';

export function GetDataFromHtml(task:ITASK, $el: Cheerio, $: CheerioStatic): any {
    const result: any = {};

    // summary data
    const dataItemClass = [
        '.age',
        '.avail',
        ['.truck', 'equipment'],
        '.fp',
        ['.do', 'origin_radius'],
        '.origin',
        '.trip',
        ['.dest', 'destination'],
        ['.dd', 'destination_radius'],
        '.company',
        '.contact',
        '.length',
        '.weight'
    ];

    dataItemClass.forEach((item) => {
        let key: string;
        let selector: string;
        if (Array.isArray(item)) {
            [selector, key] = item;
        } else {
            key = item.substr(1);
            selector = item;
        }
        result[key] = Trim($el.find(selector).text());
    });

    // detail data
    const key_value_arr = [];
    $el.find('dl > dt, dl > dt + dd').each((_key, item) => {
        key_value_arr.push(Trim($(item).text()));
    });
    for (let i = 0; i < key_value_arr.length; i += 2) {
        result[key_value_arr[i]] = key_value_arr[i + 1];
    }

    const borkerToCarrierSpot = [
        '.widget-title-incl-text',
        '.widget-numbers-num',
        '.widget-numbers-range'
    ];
    const borkerToCarrierSpotData = borkerToCarrierSpot.map((item) => {
        return $el.find(item).text();
    });
    result['Broker-to-Carrier'] = borkerToCarrierSpotData;
    result['date'] = task.criteria.pick_up_date

    return result;
}
