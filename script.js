const city_input = document.querySelector("input");
const search_button = document.querySelector(".search-button");
const weathertext = document.querySelector(".weather");
const datecontainer = document.querySelector(".date");
const citytext = document.querySelector(".city");


var currentdate = new Date(); 
var datetime = "Last Sync: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();



const weather_code_list = {
  0 : "Clear sky",
  1 : "Mainly clear",
  2 : "Partly cloudy",
  3 : "Overcast",
  45 : "Fog",
  48 : "Fog",
  51 : "Light drizzle",
  53 : "Moderate drizzle",
  55 : "Dense drizzle",
  56 : "Light freezing drizzle",
  57 : "Dense freezing drizzle",
  61 : "Slight rain",
  63 : "Moderate rain",
  65 : "Heavy rain",
  66 : "Light freezing rain",
  67 : "Heavy freezing rain",
  71 : "Slight snowfall",
  73 : "Moderate snowfall",
  75 : "Heavy snowfall",
  77 : "Snow grains",
  80 : "Slight rain showers",
  81 : "Moderate rain showers",
  82 : "Violent rain showers",
  85 : "Slight snow showers",
  86 : "Heavy snow showers",
  95 : "Thunderstorm",
  96 : "Thunderstorm with slight hail",
  97 : "Heavy thunderstorm",
  99 : "Thunderstorm with heavy hail",
}

const months = {
  1 : "January",
  2 : "February",
  3 : "March",
  4 : "April",
  5 : "May",
  6 : "June",
  7 : "July",
  8 : "August",
  9 : "September",
  10 : "October",
  11 : "November",
  12 : "December"
}

datecontainer.innerHTML = `${currentdate.getDate()}th of ${months[currentdate.getMonth()+1]}`;

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
  const response = await fetch(url);
  return response.json();
}

async function getCoords(cityName) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=ru`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.results?.length) {
    return { lat: data.results[0].latitude, lon: data.results[0].longitude };
  }
  throw new Error('Город не найден');
}

// 🔑 обратное геокодирование — координаты → название города
async function getCityNameByCoords(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ru`;
    const res = await fetch(url);
    const data = await res.json();
    return data.city || data.locality || data.principalSubdivision || 'Ваше местоположение';
  } catch {
    return 'Ваше местоположение';
  }
}

async function showWeatherByCoords(lat, lon, cityName = 'Ваше местоположение') {
  try {
    const data = await getWeather(lat, lon);
    const desc = weather_code_list[data.current.weather_code] ?? 'Unknown';
    citytext.innerHTML = `${cityName}`
    weathertext.innerHTML =
      `${data.current.temperature_2m}${data.current_units.temperature_2m} ${desc}<br>`;
  } catch (err) {
    weathertext.innerHTML = 'Не удалось получить погоду';
    console.error(err);
  }
}

async function initByGeolocation() {
  if (!navigator.geolocation) {
    weathertext.innerHTML = 'Геолокация не поддерживается';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const cityName = await getCityNameByCoords(latitude, longitude); // ← имя города
      showWeatherByCoords(latitude, longitude, cityName);
    },
    (error) => {
      weathertext.innerHTML = 'Разреши геолокацию или введи город вручную';
      console.error('Geolocation error:', error.message);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
  );
}

search_button.addEventListener("click", async () => {
  const cityname = city_input.value.trim();
  if (!cityname) return;

  try {
    const coords = await getCoords(cityname);
    await showWeatherByCoords(coords.lat, coords.lon, cityname); // ← без двойного fetch
  } catch (err) {
    weathertext.innerHTML = 'Не удалось получить погоду';
    console.error(err);
  }
});

// запуск
initByGeolocation();