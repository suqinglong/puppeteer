import puppeteer from 'puppeteer';

class SiteStack {
  private stack: Array<DetailPage> = []
  private stackDeep = 5
  private detailPages: Array<DetailPage> = []


  public siteStack(detailPages: Array<DetailPage>, stackDeep?: number) {
    this.detailPages = detailPages;
    if (stackDeep) {
      this.stackDeep = stackDeep
    }
    for (let i = 0; i < this.stackDeep; i++) {
      this.stack.push()
    }

    this.push()
  }

  public remove(page: DetailPage) {
    this.stack.splice(this.stack.indexOf(page), 1)
    this.push()
  }

  private  push() {
    while (this.stack.length < this.stackDeep && this.detailPages.length > 0) {
      const newPage = this.detailPages.shift()
      this.stack.push(newPage)
    }
  }
}

abstract class DetailPage {
  private searchUrl: string
  private siteStack: SiteStack
  private page: puppeteer.Page
  public DetailPage(searchUrl: string, siteStack: SiteStack, page: puppeteer.Page) {
    this.searchUrl = searchUrl
    this.siteStack = siteStack
    this.page = page
  }

  public searchEnd() {
    this.siteStack.remove(this)
  }

  public abstract async search()

}