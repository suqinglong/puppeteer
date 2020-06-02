import axios from 'axios';
import { settings } from './settings';

export async function PostSearchData(records: Array<IResultData>): Promise<{ data: any }> {
    if (records.length > 0) {
        return axios.post(`${settings.host}/api/internal/save_search_result`, {
            token: settings.token,
            records
        });
    }
}

export async function AddNotification(userId: string, content: string) {
    return axios.post(`${settings.host}/api/internal/new_notification`, {
        token: settings.token,
        user_id: userId,
        content
    });
}

export async function InactiveLoadSource(userId: string, loadSource: string) {
    return axios.post(`${settings.host}/api/internal/update_load_source`, {
        token: settings.token,
        user_id: userId,
        load_source: loadSource,
        account_status: 'inactive'
    });
}
