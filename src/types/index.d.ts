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