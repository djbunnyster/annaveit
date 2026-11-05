// Пути из админки приходят как «/uploads/…». На GitHub Pages сайт лежит в подпапке, поэтому приклеиваем base.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const u = (path: string) => (/^https?:\/\//.test(path) ? path : `${base}/${path.replace(/^\//, '')}`);
