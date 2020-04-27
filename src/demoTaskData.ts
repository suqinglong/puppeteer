const time = parseInt(String(Number(new Date()) / 1000), 10)

export const TaskData = {
  'Echo Driver': {
    task_id: 'f1f83186dac71994df2309d5ece61cd6',
    site: 'Echo Driver',
    user_id: '3',
    email: 'primelinkexpress@live.com',
    password: 'Gary1978',
    criteria: {
      origin: 'New York, NY',
      origin_radius: '100',
      destination: '',
      destination_radius: '100',
      pick_up_date: '2020-04-24',
      equipment: 'Van'
    },
    time: time
  },

  'DAT': {
    task_id: '0b5b9b2bb3397bc8c399c4c8f58a5bee',
    site: 'DAT',
    user_id: '3',
    email: 'haulistix',
    password: 'Shostakovich5',
    criteria: {
      origin: 'New York, NY',
      origin_radius: '100',
      destination: 'New York, NY',
      destination_radius: '100',
      pick_up_date: '2020-04-24',
      equipment: 'Van'
    },
    time: time
  },

  'JB Hunt 360': {
    task_id: '0b5b9b2bb3397bc8c399c4c8f58a5bee',
    site: 'JB Hunt 360',
    user_id: '3',
    email: 'brent@primelinkexpress.com',
    password: 'Annaleigh1',
    criteria: {
      origin: 'New York, NY',
      origin_radius: '100',
      destination: 'New York, NY',
      destination_radius: '100',
      pick_up_date: '2020-04-24',
      equipment: 'Van'
    },
    time: time
  }, 

  'Navisphere': {
    task_id: '0b5b9b2bb3397bc8c399c4c8f58a5bee',
    site: 'Navisphere',
    user_id: '3',
    email: 'brentprimelink',
    password: 'Annaleigh1',
    criteria: {
      origin: 'New York, NY',
      origin_radius: '100',
      destination: 'New York, NY',
      destination_radius: '100',
      pick_up_date: '2020-04-24,2020-04-30',
      equipment: 'Van'
    },
    time: time
  }
}
