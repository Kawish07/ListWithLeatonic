// client/src/utils/location.js
// Utilities to detect user location via IPInfo and to help filter properties by country

const DEFAULT_TOKEN = process.env.REACT_APP_IPINFO_TOKEN || 'dca4cc474f730f';

const US_STATE_ABBREVS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];

const US_STATE_NAMES = [
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming','district of columbia'
];

const CA_PROVINCE_ABBREVS = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'];
const CA_PROVINCE_NAMES = ['alberta','british columbia','manitoba','new brunswick','newfoundland and labrador','nova scotia','northwest territories','nunavut','ontario','prince edward island','quebec','saskatchewan','yukon'];

export async function getUserCountry(token = DEFAULT_TOKEN) {
  try {
    const res = await fetch(`https://ipinfo.io/json?token=${token}`);
    if (!res.ok) return null;
    const data = await res.json();
    // example: { ip, city, region, country: 'US', loc, org, postal }
    return data.country || null;
  } catch (err) {
    console.warn('Failed to detect location via IPInfo', err);
    return null;
  }
}

export function isStateInCountry(state = '', countryCode) {
  if (!state) return false;
  const s = state.trim();
  const upper = s.toUpperCase();
  const lower = s.toLowerCase();

  if (countryCode === 'US') {
    return US_STATE_ABBREVS.includes(upper) || US_STATE_NAMES.includes(lower);
  }

  if (countryCode === 'CA') {
    return CA_PROVINCE_ABBREVS.includes(upper) || CA_PROVINCE_NAMES.includes(lower);
  }

  return false;
}

export function isUSorCA(state = '') {
  return isStateInCountry(state, 'US') || isStateInCountry(state, 'CA');
}

export default {
  getUserCountry,
  isStateInCountry,
  isUSorCA
};
