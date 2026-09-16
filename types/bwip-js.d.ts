declare module "bwip-js" {
  export type ToSvgOptions = {
    bcid: string;
    text: string;
    scale?: number;
    eclevel?: string;
    padding?: number;
    backgroundcolor?: string;
    [key: string]: string | number | boolean | undefined;
  };

  export type BwipJs = {
    toSVG(options: ToSvgOptions): string;
  };

  const bwipjs: BwipJs;
  export default bwipjs;
}
