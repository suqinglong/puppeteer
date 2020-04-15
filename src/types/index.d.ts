interface ITASK{
  task_id: string
  site: string,
  query: {
    origin: string
    destination: string
    origin_radius: string
    destination_radius: string
    equipment: string
  }
 }