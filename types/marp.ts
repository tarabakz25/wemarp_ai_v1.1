export type RenderOptions = {
  themeName?: string
  themeCSS?: string
  extraCSS?: string
  withPrintCSS: boolean
  watermarkText?: string
}

export type RenderResult = {
  html: string
  slideCount: number
}
