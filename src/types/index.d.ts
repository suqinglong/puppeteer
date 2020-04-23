interface ITASK {
    task_id: string;
    site: string;
    email: string;
    password: string;
    user_id: string;
    criteria: {
        origin: string;
        destination: string;
        origin_radius: string;
        destination_radius: string;
        pick_up_date: string;
        equipment: 'Van' | 'Reef';
    };
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

interface IPostData {
    token: string;
    records: Array<IResultData>;
}

interface ISite {
    prePare: Function;
    search: Function;
}

interface ITasksClass {
    getTask: Function;
}

interface ISearchClass {
    doTask: Function
    prepare: Function
}

declare type IErrorType = 'logout' | 'other' | 'search';
declare type IMode = 'develop' | 'production';
