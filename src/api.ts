import axios from 'axios';
import { host, token } from './settings';


export async function PostSearchData(records: Array<IResultData>): Promise<{ data: any }> {
    return axios.post(`${host}/api/internal/save_search_result`, {
        token,
        records
    });
}

export async function AddNotification(userId: string, content:string) {
    return axios.post(`${host}/api/internal/new_notification`, {
        token,
        user_id: userId,
        content
    })
}

export async function InactiveLoadSource(userId: string, loadSource: string) {
    return axios.post(`${host}/api/internal/update_load_source`, {
        token,
        user_id: userId,
        load_source: loadSource,
        account_status: 'inactive'
    })
}