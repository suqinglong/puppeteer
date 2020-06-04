import { SearchSite } from './searchSite';
import dateformat from 'dateformat';
import { getRadiusFromValues, getCityAndState } from '../tools/index';
import { settings } from '../settings';
import axios from 'axios';

export class TQL extends SearchSite {
    public static siteName = 'TQL';
    protected debugPre = 'TQL';

    protected async search(task: ITASK) {
        const { originCity, originState, destCity, destState } = getCityAndState(task);
        const radiusValues = [25, 50, 75, 100, 150, 200, 250, 300];
        const originRadius = getRadiusFromValues(Number(task.criteria.origin_radius), radiusValues);
        const destRadius = getRadiusFromValues(
            Number(task.criteria.destination_radius),
            radiusValues
        );

        const postData = {
            DestCity: destCity,
            DestState: destState,
            DestRadius: destRadius,
            LoadDate: dateformat(task.criteria.pick_up_date, 'mm/dd/yyyy'),
            OriginCity: originCity,
            OriginState: originState,
            OriginRadius: originRadius,
            SaveSearch: true,
            TrailerSizeId: 3,
            TrailerTypeId: { Van: '2', Reefer: '1' }[task.criteria.equipment] || '0' // 0: All 1: Reefer 2: Van
        };

        this.log.log('post data', postData);

        const result = await axios
            .post(
                'https://lmservicesext.tql.com/carrierdashboard.web/api/SearchLoads/SearchAvailableLoadsByState',
                postData,
                {
                    headers: {
                        'User-Agent': settings.userAgent
                    }
                }
            )
            .then((res) => {
                if (res.data.TotalPostingsCount === 0) {
                    throw this.generateError('noData', 'no data');
                }
                this.log.log('post end, data count:', res.data.TotalPostingsCount);
                return res.data?.PostedLoads || [];
            });
        await this.postData(task, this.getDataFromResponse(result));
    }

    private getDataFromResponse(data: Array<any>): Array<IResultHTMLData> {
        const result: Array<IResultHTMLData> = data.map((item) => {
            return {
                postId: item.PostIdReferenceNumber,
                date: dateformat(item.LoadDate, 'mm/dd/yyyy'),
                origin_radius: item.OriginDistance,
                origin: [item.Origin.City, item.Origin.StateCode].join(', '),
                destination: [item.Destination.City, item.Destination.StateCode].join(', '),
                destination_radius: item.DestinationDistance,
                distance: item.Miles,
                equipment: (item.TrailerType && item.TrailerType.TrailerType) || '',
                dropDate: item.DeliveryDate,
                trailerSize: (item.TrailerSize && item.TrailerSize.TrailerSize) || '',
                weight: item.Weight,
                mode: item.Mode,
                comments: ''
            };
        });
        return result;
    }
}
