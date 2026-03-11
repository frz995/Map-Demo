declare module '@cesium/widgets' {
  export class Viewer {
    constructor(container: string | Element, options?: unknown)
    scene: unknown
    camera: unknown
    resize(): void
    destroy(): void
  }
}

declare module '@cesium/engine' {
  export const Cartesian3: {
    fromDegrees(lon: number, lat: number, height?: number): unknown
  }

  export class UrlTemplateImageryProvider {
    constructor(options: { url: string; subdomains?: string[]; credit?: string })
  }

  export class ArcGisMapServerImageryProvider {
  constructor(options: { url: string });
  static fromUrl(url: string, options?: unknown): Promise<ArcGisMapServerImageryProvider>;
}

  export class EllipsoidTerrainProvider {
    constructor(options?: unknown)
  }
}
