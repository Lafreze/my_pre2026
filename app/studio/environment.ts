/** Current conditions: Open-Meteo WMO codes. Solar direction: NOAA fractional-year approximation. */
export type Season = "spring" | "summer" | "autumn" | "winter";
export type Daytime = "dawn" | "morning" | "noon" | "evening" | "night" | "midnight";
export type Weather = "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm";
export type Place = { name: string; latitude: number; longitude: number };
export type Environment = { season: Season; time: Daytime; weather: Weather; altitude: number; azimuth: number; cloud: number; wind: number; hour: number };
export type Conditions = { weather: Weather; temperature: number; cloud: number; wind: number; timestamp: number; timezone: string };
export const seasons: Record<Season,string> = {spring:"春",summer:"夏",autumn:"秋",winter:"冬"};
export const times: Record<Daytime,string> = {dawn:"明け方",morning:"朝",noon:"昼",evening:"夕暮れ",night:"夜",midnight:"深夜"};
export const weathers: Record<Weather,string> = {clear:"晴れ",cloudy:"曇り",rain:"雨",snow:"雪",fog:"霧",storm:"雷雨"};
export const defaultPlace: Place = {name:"東京",latitude:35.68,longitude:139.69};
export function weatherCode(code: number): Weather {
  if ([0,1].includes(code)) return "clear";
  if ([2,3].includes(code)) return "cloudy";
  if ([45,48].includes(code)) return "fog";
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return "rain";
  if ([71,73,75,77,85,86].includes(code)) return "snow";
  if ([95,96,99].includes(code)) return "storm";
  throw new Error("天気コードを確認できません");
}
export function parseConditions(payload: unknown): Conditions {
  const data = payload as {current?:Record<string,unknown>;timezone?:unknown};
  const c=data?.current;
  if (!c || typeof data.timezone!=="string") throw new Error("天気データを確認できません");
  new Intl.DateTimeFormat("ja",{timeZone:data.timezone}).format();
  for(const key of ["temperature_2m","cloud_cover","wind_speed_10m","weather_code","time"])
    if(typeof c[key]!=="number"||!Number.isFinite(c[key]))throw new Error("天気データが不完全です");
  if(Number(c.cloud_cover)<0||Number(c.cloud_cover)>100||Number(c.wind_speed_10m)<0||Number(c.time)<=0)throw new Error("天気データの範囲が不正です");
  return {weather:weatherCode(Number(c.weather_code)),temperature:Number(c.temperature_2m),cloud:Number(c.cloud_cover)/100,wind:Number(c.wind_speed_10m),timestamp:Number(c.time)*1000,timezone:data.timezone};
}
export function forecastURL(place: Place) {
  const p=new URLSearchParams({latitude:place.latitude.toFixed(2),longitude:place.longitude.toFixed(2),current:"temperature_2m,weather_code,cloud_cover,wind_speed_10m",timezone:"auto",timeformat:"unixtime",forecast_days:"1"});
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}
export function solarPosition(date: Date, latitude: number, longitude: number) {
  const rad=Math.PI/180,year=date.getUTCFullYear(),days=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000;
  const day=Math.floor((date.getTime()-Date.UTC(year,0,1))/86400000)+1,hour=date.getUTCHours()+date.getUTCMinutes()/60;
  const g=2*Math.PI/days*(day-1+(hour-12)/24);
  const equation=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
  const declination=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
  const ha=((hour*60+equation+4*longitude)/4)*rad-Math.PI,lat=latitude*rad;
  const up=Math.sin(lat)*Math.sin(declination)+Math.cos(lat)*Math.cos(declination)*Math.cos(ha);
  return {altitude:Math.asin(Math.max(-1,Math.min(1,up)))/rad,azimuth:(Math.atan2(-Math.cos(declination)*Math.sin(ha),Math.cos(lat)*Math.sin(declination)-Math.sin(lat)*Math.cos(declination)*Math.cos(ha))/rad+360)%360};
}
export function seasonAt(month: number, latitude: number): Season {
  return (["winter","spring","summer","autumn"] as const)[(Math.floor(month%12/3)+(latitude<0?2:0))%4];
}
export function liveEnvironment(place: Place,c: Conditions,date: Date): Environment {
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:c.timezone,hourCycle:"h23",hour:"numeric",minute:"numeric",month:"numeric"}).formatToParts(date);
  const value=(key:string)=>Number(parts.find(p=>p.type===key)?.value);
  const hour=value("hour")+value("minute")/60,sun=solarPosition(date,place.latitude,place.longitude);
  const time:Daytime=sun.altitude<-12?(hour<5?"midnight":"night"):sun.altitude<6?(hour<12?"dawn":"evening"):hour<11?"morning":hour<16?"noon":"evening";
  return {...sun,season:seasonAt(value("month"),place.latitude),time,weather:c.weather,cloud:c.cloud,wind:c.wind,hour};
}
export function previewEnvironment(season:Season,time:Daytime,weather:Weather): Environment {
  const sun:Record<Daytime,[number,number,number]>={dawn:[3,85,5],morning:[25,115,8],noon:[55,185,12],evening:[9,260,17],night:[-20,295,21],midnight:[-55,0,2]};
  const [altitude,azimuth,hour]=sun[time];
  return {season,time,weather,altitude,azimuth,hour,cloud:weather==="clear"?.12:weather==="cloudy"?.85:1,wind:weather==="storm"?34:weather==="rain"?16:6};
}
// +X is west, +Z is north. Both the shadow light and window shafts use this vector.
export function sunDirection(env: Pick<Environment,"altitude"|"azimuth">): [number,number,number] {
  const a=env.altitude*Math.PI/180,z=env.azimuth*Math.PI/180;
  return [-Math.sin(z)*Math.cos(a),Math.sin(a),Math.cos(z)*Math.cos(a)];
}
