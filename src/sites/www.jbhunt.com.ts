import puppeteer from 'puppeteer'
export class jbhuntSite {
  page: puppeteer.Page
  url:string = 'https://www.jbhunt.com/loadboard/load-board/grid'
  origin: string
  destination: string

  constructor(page: puppeteer.Page, origin: string, destination: string) {
    this.page = page
    this.origin = origin
    this.destination = destination
  }

  async run() {
    await this.page.goto(this.url)

    const originInput = await this.page.$('.form-container .field-wrapper [formcontrolname=origin] input')
    originInput && await originInput.type(this.origin)

    const destinationInput = await this.page.$('.form-container .field-wrapper [formcontrolname=destination] input')
    destinationInput && await destinationInput.type(this.destination)

    const searchButton = await this.page.$('.form-container button.search-button')
    searchButton && await searchButton.click()

    await this.page.waitFor(300);

    const html2 = await this.page.$$eval('.ui-table-scrollable-body .ui-table-tbody tr', options => options.map(option => {
      return Array.from(option.querySelectorAll('td')).map(td => td.innerText)
    }))

    console.log('html2', html2)
  }
}

