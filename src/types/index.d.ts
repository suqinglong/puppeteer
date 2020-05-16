interface ITASK {
    task_id: string;
    site: string;
    email: string;
    password: string;
    user_id: string;
    time: string;
    criteria: {
        origin: string;
        destination: string;
        origin_radius: string;
        destination_radius: string;
        pick_up_date: string;
        equipment: 'Van' | 'Reef';
    };
}

interface IQuery {
    origin: string;
    destination: string;
    origin_radius: string;
    destination_radius: string;
    pick_up_date: string;
    equipment: 'Van' | 'Reef';
}

interface IResultData {
    task_id: string;
    date: string;
    source: string;
    equipment: string;
    origin: string;
    origin_radius: string;
    destination: string;
    destination_radius: string;
    distance: string;
    extra: string;
}

interface IResultHTMLData {
    date: string;
    equipment: string;
    origin: string;
    origin_radius: string;
    destination: string;
    destination_radius: string;
    distance: string;
    [key: string]: any;
}

interface IPostData {
    token: string;
    records: Array<IResultData>;
}

interface ISite {
    doSearch: Function;
}

interface ITasksClass {
    getTask: Function;
}

interface ISearchClass {
    doTask: Function;
    createBrowser: Function;
}

declare type IErrorType = 'logout' | 'other' | 'search' | 'noData' | 'timeout' | 'unableToLogin';
declare type IMode = 'develop' | 'production';
declare type IbrowserWSEndpoint = string;
