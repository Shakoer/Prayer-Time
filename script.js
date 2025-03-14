document.addEventListener("DOMContentLoaded", () => {
	const locationForm = document.getElementById("location-form");
	const showLocationBtn = document.getElementById("show-location");
	const autoDetectBtn = document.getElementById("auto-detect");
	const latitudeInput = document.getElementById("latitude");
	const longitudeInput = document.getElementById("longitude");
	const saveLocationBtn = document.getElementById("save-location");
	const locationStatus = document.getElementById("location-status");
	const dailyPrayersList = document.getElementById("daily-prayers");
	const countdownTimerEl = document.getElementById("countdown-timer");
	const hijriDateEl = document.getElementById("hijri-date");
	const verseTextEl = document.getElementById("verse-text");
	const verseRefEl = document.getElementById("verse-reference");
	const darkModeToggle = document.getElementById("dark-mode-toggle");

	let lat = localStorage.getItem("latitude") || "";
	let lon = localStorage.getItem("longitude") || "";

	if (lat && lon) {
		latitudeInput.value = lat;
		longitudeInput.value = lon;
		fetchPrayerTimes(lat, lon);
		locationForm.classList.add("hidden");
	}

	function fetchPrayerTimes(latitude, longitude) {
		const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`;

		fetch(url)
			.then(res => res.json())
			.then(data => {
				hijriDateEl.textContent = `Hijri Date: ${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;

				dailyPrayersList.innerHTML = "";
				const timings = data.data.timings;
				for (let prayer in timings) {
					let li = document.createElement("li");
					li.textContent = `${prayer}: ${timings[prayer]}`;
					dailyPrayersList.appendChild(li);
				}

				startCountdown(timings.Maghrib);
				scheduleNotification("Fajr", timings.Fajr, 15);
				scheduleNotification("Maghrib", timings.Maghrib, 10);
			});
	}

	function startCountdown(maghribTime) {
		function updateCountdown() {
			const now = new Date();
			const [hours, minutes] = maghribTime.split(":").map(Number);
			const maghribDate = new Date();
			maghribDate.setHours(hours, minutes, 0);

			const diff = maghribDate - now;
			if (diff <= 0) {
				countdownTimerEl.textContent = "It's Maghrib!";
				clearInterval(interval);
				return;
			}

			const h = Math.floor(diff / 3600000);
			const m = Math.floor((diff % 3600000) / 60000);
			const s = Math.floor((diff % 60000) / 1000);

			countdownTimerEl.textContent = `${h}h ${m}m ${s}s`;
		}

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
	}

	function scheduleNotification(prayer, time, minutesBefore) {
		if (!("Notification" in window)) return;
		Notification.requestPermission().then(permission => {
			if (permission === "granted") {
				const now = new Date();
				const [hours, minutes] = time.split(":").map(Number);
				const prayerTime = new Date();
				prayerTime.setHours(hours, minutes - minutesBefore, 0);

				const delay = prayerTime - now;
				if (delay > 0) {
					setTimeout(() => {
						new Notification(`${prayer} Reminder`, {
							body: `${prayer} is in ${minutesBefore} minutes.`
						});
					}, delay);
				}
			}
		});
	}

	function fetchQuranVerse() {
		fetch("https://api.alquran.cloud/v1/ayah/262/en.asad")
			.then(res => res.json())
			.then(data => {
				verseTextEl.textContent = `"${data.data.text}"`;
				verseRefEl.textContent = `- ${data.data.surah.englishName}, ${data.data.surah.number}:${data.data.numberInSurah}`;
			});
	}


	autoDetectBtn.addEventListener("click", () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(position => {
				lat = position.coords.latitude.toFixed(6);
				lon = position.coords.longitude.toFixed(6);

				latitudeInput.value = lat;
				longitudeInput.value = lon;

				localStorage.setItem("latitude", lat);
				localStorage.setItem("longitude", lon);

				fetchPrayerTimes(lat, lon);
				locationForm.classList.add("hidden");
			}, () => {
				locationStatus.textContent = "Failed to get location. Please enter manually.";
			});
		} else {
			locationStatus.textContent = "Geolocation not supported.";
		}
	});

	saveLocationBtn.addEventListener("click", () => {
		lat = latitudeInput.value.trim();
		lon = longitudeInput.value.trim();

		if (!lat || !lon) {
			alert("Please enter both latitude and longitude.");
			return;
		}

		localStorage.setItem("latitude", lat);
		localStorage.setItem("longitude", lon);

		fetchPrayerTimes(lat, lon);
		locationForm.classList.add("hidden");
	});

	showLocationBtn.addEventListener("click", () => {
		locationForm.classList.toggle("hidden");
	});

	fetchQuranVerse();
	if (lat && lon) fetchPrayerTimes(lat, lon);
});