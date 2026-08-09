export const SITE_SETTING_DEFAULTS = {
  companyName: "Permis Go Auto École",
  domainName: "www.permisgo.fr",
  websiteUrl: "https://www.permisgoautoecole.com",
  supportEmail: "support@permisgo.fr",
  admissionEmail: "admission@permisgoautoecole.com",
  phone: "09 56 73 63 33",
  mobile: "06 24 82 40 09",
  whatsappNumber: "+33 6 24 82 40 09",
  whatsappUrl: "https://wa.me/33624824009",
  address: "100 Rue Danielle Casanova, 93300 Aubervilliers, France",
  address2: "37 Rue Bouret, 75019 Paris, France",
  googleMapUrl: "https://maps.app.goo.gl/iaFZNXTUhQ7vmzkc8",
  facebookUrl: "https://www.facebook.com/permisgoautoecole/",
  instagramUrl: "https://www.instagram.com/permisgoautoecole/",
  tiktokUrl: "https://www.tiktok.com/@permisgoautoecole",
  youtubeUrl: "https://www.youtube.com/@PermisGoAutoEcole",
};

export const SITE_SETTING_KEYS = Object.keys(SITE_SETTING_DEFAULTS);

export const buildSiteSettings = (items = []) => {
  const values = new Map(items.map((item) => [item.key, item.value]));
  return Object.fromEntries(
    SITE_SETTING_KEYS.map((key) => [key, String(values.get(key) || SITE_SETTING_DEFAULTS[key])]),
  );
};
