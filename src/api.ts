import axios from 'axios';
import { host } from './settings';

export function PostSearchData(records: Array<IResultData>): Promise<{ data: any }> {
    return axios.post(`${host}/api/internal/save_search_result`, {
        token: '6bbcbce7bc90c008',
        records
    });
}
