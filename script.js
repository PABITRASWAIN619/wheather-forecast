const apiKey = "bac84d8ac41e3ae637dac5de0d8bc2b9";

/* SEARCH */
async function searchLocation() {
  const query = document.getElementById("cityInput").value.trim();
  const box = document.getElementById("suggestions");

  if (query.length < 2) {
    box.innerHTML = "";
    return;
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;
  const data = await (await fetch(url)).json();
  box.innerHTML = "";

  data.forEach(place => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerText = `${place.name}, ${place.country}`;
    div.onclick = () => {
      document.getElementById("cityInput").value = place.name;
      box.innerHTML = "";
      loadWeatherByCoords(place.lat, place.lon, place.name);
    };
    box.appendChild(div);
  });
}

/* GET WEATHER */
async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return alert("Enter a place name");

  const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;
  const geoData = await (await fetch(geoURL)).json();
  if (!geoData.length) return alert("Location not found");

  loadWeatherByCoords(geoData[0].lat, geoData[0].lon, geoData[0].name);
}

/* LOAD WEATHER */
async function loadWeatherByCoords(lat, lon, placeName = "") {
  document.getElementById("loader").classList.add("show");

  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  const currentData = await (await fetch(weatherURL)).json();
  const forecastData = await (await fetch(forecastURL)).json();

  document.getElementById("cityName").innerText = placeName || currentData.name;

  const temp = Math.round(currentData.main.temp);
  const tempEl = document.getElementById("temperature");
  tempEl.innerText = temp + "°C";

  document.getElementById("minTemp").innerText =
    "Min: " + Math.round(currentData.main.temp_min) + "°C";

  document.getElementById("maxTemp").innerText =
    "Max: " + Math.round(currentData.main.temp_max) + "°C";

  document.getElementById("sunrise").innerText =
    "🌅 " + new Date(currentData.sys.sunrise * 1000).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});

  document.getElementById("sunset").innerText =
    "🌇 " + new Date(currentData.sys.sunset * 1000).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});

  document.getElementById("description").innerText =
    currentData.weather[0].description;

  document.getElementById("humidity").innerText =
    currentData.main.humidity + "%";

  document.getElementById("wind").innerText =
    currentData.wind.speed + " m/s";

  document.getElementById("feelsLike").innerText =
    Math.round(currentData.main.feels_like) + "°C";

  document.getElementById("weatherIcon").src =
    `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;

  setWeatherAnimation(currentData.weather[0].main);

  createFiveDayForecast(forecastData);
  createWeeklyForecast(forecastData);
  createHourlyChart(forecastData);

  document.getElementById("loader").classList.remove("show");
}

/* WEATHER BACKGROUND */
function setWeatherAnimation(type) {
  const anim = document.getElementById("weatherAnimation");
  anim.className = "";

  if (type === "Clear") anim.classList.add("sunny");
  else if (type === "Rain" || type === "Drizzle") anim.classList.add("rain");
  else if (type === "Snow") anim.classList.add("snow");
  else anim.classList.add("clouds");
}

/* FORECAST */
function createFiveDayForecast(data) {
  const box = document.getElementById("forecast");
  box.innerHTML = "";

  for (let i = 0; i < data.list.length; i += 8) {
    const d = data.list[i];
    box.innerHTML += `
      <div class="forecast-card">
        <span>${d.dt_txt.split(" ")[0]}</span>
        <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png">
        <span>${Math.round(d.main.temp)}°C</span>
      </div>
    `;
  }
}

function createWeeklyForecast(data) {
  const daysMap = {};
  data.list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!daysMap[date]) daysMap[date] = item;
  });

  const buttons = document.getElementById("dayButtons");
  const details = document.getElementById("dayDetails");
  buttons.innerHTML = "";

  Object.keys(daysMap).forEach(date => {
    const dayName = new Date(date)
      .toLocaleDateString("en-US", { weekday: "short" });

    const d = daysMap[date];
    const btn = document.createElement("button");
    btn.innerText = dayName;

    btn.onclick = () => {
      details.innerHTML = `
        <h3>${dayName}</h3>
        <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png">
        <p>Temp: ${Math.round(d.main.temp)}°C</p>
        <p>${d.weather[0].description}</p>
        <p>Humidity: ${d.main.humidity}%</p>
        <p>Wind: ${d.wind.speed} m/s</p>
      `;
    };

    buttons.appendChild(btn);
  });
}

function createHourlyChart(data) {
  const ctx = document.getElementById("hourlyChart").getContext("2d");

  const hours = data.list.slice(0, 8).map(item =>
    new Date(item.dt_txt).getHours() + ":00"
  );

  const temps = data.list.slice(0, 8).map(item =>
    Math.round(item.main.temp)
  );

  if (window.hourChart) window.hourChart.destroy();

  window.hourChart = new Chart(ctx, {
    type: "line",
    data: { labels: hours, datasets: [{ data: temps, tension: 0.4 }] },
    options: { plugins: { legend: { display: false } } }
  });
}

function getLocationWeather() {
  navigator.geolocation.getCurrentPosition(pos => {
    loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
  });
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
}

function openDetail(type) {
  const screen = document.getElementById("detailScreen");
  const title = document.getElementById("detailTitle");
  const content = document.getElementById("detailContent");

  screen.classList.add("show");

  if (type === "humidity") {
    title.innerText = "Humidity Details";
    content.innerHTML = `<h1>${document.getElementById("humidity").innerText}</h1>`;
  }
  if (type === "wind") {
    title.innerText = "Wind Details";
    content.innerHTML = `<h1>${document.getElementById("wind").innerText}</h1>`;
  }
  if (type === "feels") {
    title.innerText = "Feels Like Temperature";
    content.innerHTML = `<h1>${document.getElementById("feelsLike").innerText}</h1>`;
  }
}

function goBack() {
  document.getElementById("detailScreen").classList.remove("show");
}

window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    });
  }
};

window.addEventListener("offline", () => {
  document.getElementById("offlineMsg").classList.add("show");
});

window.addEventListener("online", () => {
  document.getElementById("offlineMsg").classList.remove("show");
});