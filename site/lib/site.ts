export const SITE_URL = "https://tvtidy.app";
export const SITE_NAME = "TVTidy";

export const absoluteUrl = (pathname: string) => new URL(pathname, SITE_URL).toString();
