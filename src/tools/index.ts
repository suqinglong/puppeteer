import minimist from 'minimist';
import xlsx from 'node-xlsx';

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

    return dataArr.map((data) => {
        let extroData: any = {};
        Object.keys(data).forEach((key) => {
            if (keys.indexOf(key) === -1 && data[key]) {
                extroData[key] = data[key];
            }
        });

        return {
            task_id: task.task_id,
            date: data.date,
            source: task.site,
            equipment: data.equipment,
            origin: data.origin,
            origin_radius: data.origin_radius,
            destination: data.destination,
            destination_radius: data.destination_radius,
            distance: data.distance || '0',
            extra: JSON.stringify(extroData)
        };
    });
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
        searchQuery += `&${key}=${encodeURIComponent(search[key])}`;
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
