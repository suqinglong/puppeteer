interface ITASK {
  task_id: string
  site: string,
  criteria: {
    origin: string
    destination: string
    origin_radius: string
    destination_radius: string
    pick_up_date: string
    equipment: string
  }
}

interface IResultData {
  task_id: string, 
  date: string, 
  source: string, 
  equipment: string, 
  origin: string, 
  origin_radius: string, 
  destination: string, 
  destination_radius: string, 
  distance: string, 
  extra: object
}