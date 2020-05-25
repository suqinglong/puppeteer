import minimist from 'minimist';
import xlsx from 'node-xlsx';
import dateformat from 'dateformat';

export function getParams(url: string, key: string): string {
    const matches = url.match(/([^?=&]+=[^=&]+)/g);
    const result = {};
    matches.forEach((match) => {
        const [key, value] = match.split('=').map((item) => decodeURIComponent(item));
        result[key] = value;
    });
    return result[key];
}

export function getMode(): IMode {
    let args = minimist(process.argv.slice(2));
    return args.mode;
}

export function useDev(): 'yes' | null {
    let args = minimist(process.argv.slice(2));
    return args.usedev;
}

export function useScreenshot(): 'yes' | null {
    let args = minimist(process.argv.slice(2));
    return args.useScreenshot;
}

export function ModifyPostData(task: ITASK, dataArr: Array<any>): Array<IResultData> {
    const keys = [
        'date',
        'source',
        'equipment',
        'origin',
        'origin_radius',
        'destination',
        'destination_radius',
        'distance'
    ];

    const result = dataArr.map((data) => {
        let extroData: any = {};
        Object.keys(data).forEach((key) => {
            if (keys.indexOf(key) === -1 && data[key]) {
                extroData[key] = data[key];
            }
        });

        return {
            task_id: task.task_id,
            date: formateDate(data.date),
            source: task.site,
            equipment: data.equipment,
            origin: data.origin,
            origin_radius: String(data.origin_radius),
            destination: data.destination,
            destination_radius: String(data.destination_radius),
            distance: String(data.distance || '0'),
            extra: JSON.stringify(extroData)
        };
    });
    if (getMode() === 'develop') {
        console.log('ModifyPostData', result);
    }
    return result;
}

export function Trim(str: string) {
    return str
        .trim()
        .replace(/\n/g, '')
        .replace(/\s{2,}/g, ' ');
}

export function createUrl(baseUrl: string, search: { [key: string]: string | boolean | number }) {
    let searchQuery = '';
    Object.keys(search).forEach((key) => {
        const v = String(search[key]);
        searchQuery += `&${key}=${encodeURIComponent(v)}`;
    });
    return baseUrl + '?' + searchQuery.substr(1);
}

export function xlsxParse(file: string) {
    return xlsx.parse(file)[0]['data'];
}

export function getRadiusFromValues(radius: number, radiusValues: Array<number>) {
    let result = 0;
    const len = radiusValues.length;

    if (radiusValues.indexOf(radius) > -1) {
        return radius;
    }

    if (radius < radiusValues[0]) {
        return radiusValues[0];
    }

    if (radius > radiusValues[len - 1]) {
        return radiusValues[len - 1];
    }

    for (let i = 0; i < len - 1; i++) {
        if (radius > radiusValues[i] && radius < radiusValues[i + 1]) {
            result = radiusValues[i + 1];
            break;
        }
    }
    return result;
}

export function formateDate(time: string): string {
    try {
        return dateformat(time, 'yyyy-mm-dd HH:MM:ss');
    } catch (e) {
        console.log('formateDate:', time);
    }
}
