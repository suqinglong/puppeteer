const time = parseInt(String(Number(new Date()) / 1000), 10);
import dateFormat from 'dateformat';

const pickUpDate = dateFormat(new Date(Number(new Date()) + 0 * 24 * 3600 * 1000), 'yyyy-mm-dd');

export const TaskData = {
    Echo: {
        task_id: 'f1f83186dac71994df2309d5ece61cd6',
        site: 'Echo',
        user_id: '3',
        email: 'primelinkexpress@live.com',
        password: 'Gary1978',
        criteria: {
            origin: 'New York, NY',
            origin_radius: '100',
            destination: '',
            destination_radius: '100',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        },
        time: time
    },

    DAT: {
        task_id: '0b5b9b2bb3397bc8c399c4c8f58a5bee',
        site: 'DAT',
        user_id: '3',
        email: 'haulistix',
        password: 'Shostakovich5',
        criteria: {
            origin: 'Hauppauge, NY',
            origin_radius: '150',
            destination: 'Windsor, CT',
            destination_radius: '150',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        },
        time: time
    },

    'JB Hunt': {
        task_id: '0b5b9b2bb3397bc8c399c4c8f58a5bee',
        site: 'JB Hunt',
        user_id: '3',
        email: 'dispatch@ajgtransport.com',
        password: 'Alwaysloaded400',
        criteria: {
            origin: 'Atwater, CA',
            origin_radius: '100',
            destination: 'Sumner, WA',
            destination_radius: '100',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        },
        time: time
    },

    'CH Robinson': {
        task_id: '0b5b9b2bb3397bc8c399c4c8f58a5bee',
        site: 'CH Robinson',
        user_id: '3',
        email: 'brentprimelink',
        password: 'Annaleigh1',
        criteria: {
            origin: 'Atwater, CA',
            origin_radius: '150',
            destination: 'Sumner, WA',
            destination_radius: '150',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        },
        time: time
    },

    Coyote: {
        task_id: '0b5b9b2bb3397bc8c399c4c8f58a5bee',
        site: 'Coyote',
        user_id: '3',
        email: 'dispatch@ajgtransport.com',
        password: 'KeepLoaded20!',
        criteria: {
            origin: 'Hauppauge, NY',
            origin_radius: '150',
            destination: 'Windsor, CT',
            destination_radius: '150',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        },
        time: time
    },

    Sunteck: {
        task_id: '0b5b9b2bb3397bc8c399c4c8f58a5bee',
        site: 'Sunteck',
        user_id: '3',
        email: 'ajgtransportation@gmail.com',
        password: 'KeepLoaded19',
        time: time,
        criteria: {
            origin: 'Lakeland, FL',
            origin_radius: '250',
            destination: 'Augusta, GA',
            destination_radius: '250',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        }
    },

    Werner: {
        task_id: '0b5b9b2bb3397bc8c399c4c8f58a5bee',
        site: 'Werner',
        user_id: '3',
        email: 'ajgtransportation@gmail.com',
        password: 'KeepLoaded19',
        time: time,
        criteria: {
            origin: 'Atwater, CA',
            origin_radius: '250',
            destination: 'Sumner, WA',
            destination_radius: '250',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        }
    },

    TQL: {
        task_id: '06f3f3fb279ff7d831d1acc8a1bbda40',
        site: 'TQL',
        user_id: '3',
        email: 'ajgtransportation@gmail.com',
        password: 'KeepLoaded19',
        criteria: {
            origin: 'Tulare, CA',
            origin_radius: '100',
            destination: 'Morris, IL',
            destination_radius: '100',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        },
        time
    },

    'Uber Freight': {
        task_id: '06f3f3fb279ff7d831d1acc8a1bbda40',
        site: 'Uber Freight',
        user_id: '3',
        email: 'primelinkexpress@live.com',
        password: 'Prime513@',
        criteria: {
            origin: 'Atwater, CA',
            origin_radius: '200',
            destination: 'Sumner, WA',
            destination_radius: '200',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        },
        time
    },

    Landstar: {
        task_id: '06f3f3fb279ff7d831d1acc8a1bbda40',
        site: 'Landstar',
        user_id: '3',
        email: 'ajgtranspo',
        password: 'Loaded2020',
        criteria: {
            origin: 'SYRACUSE, NY',
            origin_radius: '250',
            destination: 'ROWLEY, MA',
            destination_radius: '250',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        },
        time
    },
    Allenlund: {
        task_id: '06f3f3fb279ff7d831d1acc8a1bbda40',
        site: 'Allenlund',
        user_id: '3',
        email: '187173',
        password: 'Loaded2020!',
        criteria: {
            origin: 'Atwater, CA',
            origin_radius: '250',
            destination: 'Sumner, WA',
            destination_radius: '250',
            pick_up_date: pickUpDate,
            equipment: 'Van'
        },
        time
    }
};
