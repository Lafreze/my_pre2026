export async function mockWeather(page,override={}) {
  await page.route('https://api.open-meteo.com/v1/forecast?**',route=>route.fulfill({json:{timezone:'Asia/Tokyo',current:{time:Math.floor(Date.now()/1000),temperature_2m:22.4,cloud_cover:15,wind_speed_10m:5,weather_code:0,...override}}}));
}
