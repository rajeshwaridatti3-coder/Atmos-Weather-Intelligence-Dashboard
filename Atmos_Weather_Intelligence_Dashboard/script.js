const $ = (id) => document.getElementById(id);
const state = { lat: 24.7955, lon: 84.9994, city: "Gaya", country: "India", timezone: "Asia/Kolkata", unit: "C", weather: null, air: null };
const weatherCodes = {
  0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
  45:["Fog","🌫️"],48:["Depositing rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Dense drizzle","🌧️"],
  56:["Freezing drizzle","🌧️"],57:["Freezing drizzle","🌧️"],61:["Slight rain","🌦️"],63:["Moderate rain","🌧️"],65:["Heavy rain","🌧️"],
  66:["Freezing rain","🌧️"],67:["Freezing rain","🌧️"],71:["Slight snow","🌨️"],73:["Moderate snow","🌨️"],75:["Heavy snow","❄️"],
  77:["Snow grains","🌨️"],80:["Rain showers","🌦️"],81:["Rain showers","🌧️"],82:["Violent rain showers","⛈️"],
  85:["Snow showers","🌨️"],86:["Heavy snow showers","❄️"],95:["Thunderstorm","⛈️"],96:["Thunderstorm with hail","⛈️"],99:["Thunderstorm with hail","⛈️"]
};
const weatherInfo = (code) => weatherCodes[code] || ["Variable conditions","🌤️"];
const toTemp = (c) => state.unit === "C" ? Math.round(c) : Math.round(c * 9/5 + 32);
const tempText = (c) => `${toTemp(c)}°`;
const timeText = (iso) => iso ? new Date(iso).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "--:--";
const dayText = (iso, opts={weekday:"short"}) => new Date(iso+"T12:00:00").toLocaleDateString([],opts);
const showToast = (message) => { const el=$("toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2600); };

async function fetchWeather(lat, lon) {
  $("updatedAt").textContent = "Updating live weather...";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,ozone&timezone=auto`;
  const [weatherRes, airRes] = await Promise.all([fetch(url), fetch(airUrl)]);
  if (!weatherRes.ok) throw new Error("Weather service could not be reached.");
  state.weather = await weatherRes.json();
  state.air = airRes.ok ? await airRes.json() : null;
  state.timezone = state.weather.timezone || "auto";
  render();
}

function render() {
  const w=state.weather, c=w.current, d=w.daily, h=w.hourly;
  const [condition,icon]=weatherInfo(c.weather_code);
  $("currentCity").textContent = `${state.city}${state.country ? ", "+state.country : ""}`;
  $("locationLabel").textContent = `${state.city}${state.country ? ", "+state.country : ""}`;
  $("currentDate").textContent = new Intl.DateTimeFormat("en",{weekday:"long",month:"long",day:"numeric",timeZone:state.timezone}).format(new Date());
  $("currentTemp").innerHTML = `${toTemp(c.temperature_2m)}<span>°</span>`;
  $("currentCondition").textContent=condition; $("mainWeatherIcon").textContent=icon;
  $("feelsLike").textContent=tempText(c.apparent_temperature);
  $("highLow").textContent=`H: ${tempText(d.temperature_2m_max[0])}   L: ${tempText(d.temperature_2m_min[0])}`;
  $("humidity").innerHTML=`${c.relative_humidity_2m}<small>%</small>`;
  $("wind").innerHTML=`${Math.round(c.wind_speed_10m)}<small> km/h</small>`;
  $("visibility").innerHTML=`${(h.visibility[0]/1000).toFixed(1)}<small> km</small>`;
  $("pressure").innerHTML=`${Math.round(c.surface_pressure)}<small> hPa</small>`;
  $("humidityBar").style.width=`${c.relative_humidity_2m}%`;
  $("windBar").style.width=`${Math.min(c.wind_speed_10m/80*100,100)}%`;
  $("visibilityBar").style.width=`${Math.min(h.visibility[0]/10000*100,100)}%`;
  $("pressureBar").style.width=`${Math.min((c.surface_pressure-950)/100*100,100)}%`;
  $("windDirection").textContent=`Direction ${Math.round(c.wind_direction_10m)}°`;
  $("coordinates").textContent=`${state.lat.toFixed(2)}°, ${state.lon.toFixed(2)}°`;
  const rise=d.sunrise[0], set=d.sunset[0];
  $("sunrise").textContent=$("sunrise2").textContent=timeText(rise);
  $("sunset").textContent=$("sunset2").textContent=timeText(set);
  const minutes=Math.max(0,Math.round((new Date(set)-new Date(rise))/60000));
  $("daylight").textContent=`${Math.floor(minutes/60)}h ${minutes%60}m`;
  renderHourly(); renderWeekly(); renderAir(); renderRecommendation(condition,icon,c);
  $("updatedAt").textContent=`Live data · Updated ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`;
}
function renderHourly(){
  const h=state.weather.hourly; const now=new Date();
  let start=h.time.findIndex(t=>new Date(t)>=now); if(start<0)start=0;
  $("hourlyForecast").innerHTML=Array.from({length:8},(_,i)=>{
    const ix=Math.min(start+i,h.time.length-1), info=weatherInfo(h.weather_code[ix]);
    const label=i===0?"Now":new Date(h.time[ix]).toLocaleTimeString([],{hour:"numeric"});
    return `<div class="hour-item"><span>${label}</span><span class="hour-icon">${info[1]}</span><strong>${tempText(h.temperature_2m[ix])}</strong><small>${h.precipitation_probability[ix] ?? 0}% rain</small></div>`;
  }).join("");
}
function renderWeekly(){
  const d=state.weather.daily;
  $("weeklyForecast").innerHTML=d.time.map((date,i)=>{
    const [desc,icon]=weatherInfo(d.weather_code[i]);
    return `<div class="day-row"><div class="day-name">${i===0?"Today":dayText(date)}<span class="day-date">${new Date(date+"T12:00:00").toLocaleDateString([],{month:"short",day:"numeric"})}</span></div><div class="day-condition"><span>${icon}</span>${desc}</div><div class="temp-range"><span>${tempText(d.temperature_2m_min[i])}</span><i class="range-track"></i><strong>${tempText(d.temperature_2m_max[i])}</strong></div><span class="day-uv">UV ${Math.round(d.uv_index_max[i])}</span></div>`;
  }).join("");
}
function renderAir(){
  const a=state.air?.current;
  if(!a){$("aqiNumber").textContent="—";$("aqiLabel").textContent="Unavailable";$("aqiPill").textContent="No data";$("aqiAdvice").textContent="Air quality data is temporarily unavailable for this location.";return;}
  const v=Math.round(a.us_aqi), bands=v<=50?["Good","Air quality is good. It is a great time to enjoy outdoor activities.","#78d6b0"]:v<=100?["Moderate","Air quality is acceptable for most people. Sensitive individuals may take care.","#c7d16e"]:v<=150?["Unhealthy for sensitive groups","Sensitive groups should consider reducing prolonged outdoor exertion.","#edbd67"]:v<=200?["Unhealthy","Consider limiting prolonged outdoor activity.","#e99568"]:v<=300?["Very unhealthy","Reduce outdoor exertion and follow local health guidance.","#d87880"]:["Hazardous","Avoid prolonged outdoor activity and follow local advisories.","#9c80bd"];
  $("aqiNumber").textContent=v;$("aqiLabel").textContent=bands[0];$("aqiPill").textContent=bands[0];$("aqiPill").style.color=bands[2];$("aqiPill").style.background=bands[2]+"22";$("aqiAdvice").textContent=bands[1];
  $("pm25").innerHTML=`${Number(a.pm2_5).toFixed(1)} <small>µg/m³</small>`;$("pm10").innerHTML=`${Number(a.pm10).toFixed(1)} <small>µg/m³</small>`;$("ozone").innerHTML=`${Number(a.ozone).toFixed(1)} <small>µg/m³</small>`;
}
function renderRecommendation(condition,icon,c){
  const rainy=[51,53,55,61,63,65,80,81,82,95,96,99].includes(c.weather_code);
  let title="A good day to get outside", text="Conditions look relatively comfortable. Enjoy a walk, get some fresh air, and make the most of your day.", recIcon=icon;
  if(rainy){title="Keep an umbrella close";text="Rain is in the forecast. Consider carrying an umbrella and allowing extra time for your commute.";recIcon="☂️";}
  else if(c.temperature_2m>=34){title="Take it easy in the heat";text="Temperatures are running high. Stay hydrated, seek shade, and avoid strenuous activity during the hottest hours.";recIcon="🧴";}
  else if(c.wind_speed_10m>=30){title="A breezy day ahead";text="Winds are stronger than usual. Secure loose outdoor items and take care if cycling or riding a two-wheeler.";recIcon="💨";}
  else if(c.relative_humidity_2m>=80){title="A humid day ahead";text="High humidity can make it feel warmer. Choose breathable clothing and keep water nearby.";recIcon="💧";}
  $("recommendationIcon").textContent=recIcon;$("recommendationTitle").textContent=title;$("recommendationText").textContent=text;
}
async function searchCity(name){
  if(!name.trim())return;
  try{
    showToast("Searching for "+name+"...");
    const res=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
    const data=await res.json();
    if(!data.results?.length)throw new Error("We couldn't find that city. Try another name.");
    const place=data.results[0];state.lat=place.latitude;state.lon=place.longitude;state.city=place.name;state.country=place.country||"";
    await fetchWeather(state.lat,state.lon);showToast(`Weather loaded for ${state.city}`);
  }catch(e){showToast(e.message||"Something went wrong.");}
}
function setLocation(lat,lon,name,country){
  state.lat=lat;state.lon=lon;state.city=name;state.country=country||"";
  return fetchWeather(lat,lon);
}
$("searchForm").addEventListener("submit",e=>{e.preventDefault();searchCity($("citySearch").value);$("citySearch").blur();});
$("unitToggle").addEventListener("click",()=>{state.unit=state.unit==="C"?"F":"C";$("unitToggle").textContent=`°${state.unit}`;if(state.weather)render();});
$("themeToggle").addEventListener("click",()=>document.body.classList.toggle("light"));
$("refreshBtn").addEventListener("click",()=>fetchWeather(state.lat,state.lon).then(()=>showToast("Weather refreshed")).catch(e=>showToast(e.message)));
document.querySelectorAll(".saved-place").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".saved-place").forEach(b=>b.classList.remove("active"));btn.classList.add("active");searchCity(btn.dataset.city);}));
document.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===btn.dataset.view));
  const target=btn.dataset.view==="air"?"airSection":btn.dataset.view==="forecast"?"forecastSection":"overviewView";
  $(target).scrollIntoView({behavior:"smooth",block:"start"});
}));
function init(){
  $("unitToggle").textContent="°C";
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>setLocation(pos.coords.latitude,pos.coords.longitude,"Your location","").catch(()=>searchCity("Gaya")),()=>searchCity("Gaya"),{timeout:5000});
  }else searchCity("Gaya");
}
init();
