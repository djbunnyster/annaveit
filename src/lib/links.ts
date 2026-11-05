import site from '../data/site.json';

export const tg = `https://t.me/${site.telegram}`;
export const channel = `https://t.me/${site.channel}`;
export const mail = `mailto:${site.email}?subject=${encodeURIComponent(site.emailSubject)}`;
