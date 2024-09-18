import * as vue from "https://unpkg.com/petite-vue?module";

const app = vue.createApp({
	colours: [
		{
			id: "red",
			name: "red",
			hex: "#fc5c65",
		},
		{
			id: "orange",
			name: "orange",
			hex: "#fd9644",
		},
		{
			id: "yellow",
			name: "yellow",
			hex: "#fed330",
		},
		{
			id: "green",
			name: "emerald",
			hex: "#26de81",
		},
		{
			id: "turquoise",
			name: "turquoise",
			hex: "#2bcbba",
		},
		{
			id: "blue",
			name: "blue",
			hex: "#2980b9",
		},
		{
			id: "purple",
			name: "amethyst",
			hex: "#a55eea",
		},
		{
			id: "magenta",
			name: "magenta",
			hex: "#e056fd",
		},
		{
			id: "black",
			name: "asphalt",
			hex: "#34495e"
		}
	],

	timers: [
		{
			id: "a",
			label: "",
			millisCounter: 0,
			started: Date.now(),
			colour: "red"
		},
	],
	activeTimer: null,
	activeTimerIndex: null,
	counterDisplay: "na",
	secsCounterDisplay: "na",
	modal: null,
	modalType: null,
	modalArgs: [],
	loaded: false,

	timeDisplay(millis) {
		const minutes = Math.floor(millis / 1000 / 60);

		return `${Math.floor(minutes / 60).toString()}h : ${(minutes % 60).toString().padStart(2, "0")}m`;
	},
	secsTimeDisplay(millis) {
		const secs = Math.floor(millis / 1000);

		return `. ${(secs % 60).toString().padStart(2, "0")}s`;
	},
	humanTime: (time, padHours = false) => {
		return `${Math.floor(time / 60).toString().padStart(padHours + 1, "0")}:${(time % 1440 % 60).toString().padStart(2, "0")}`;
	},
	humanDate: date => {
		const dayNames = ["sön", "mån", "tis", "ons", "tors", "fre", "lör"]
		const monthNames = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
		return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}.`;
	},
	dateToTime: date => date.getHours() * 60 + date.getMinutes(),
	arrayEquals: (a, b) => {
		return Array.isArray(a) &&
			Array.isArray(b) &&
			a.length === b.length &&
			a.every((val, index) => val === b[index]);
	},
	uuid: () => {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
			var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	},
	useDarkColourOnBg: bgColour => {
		const hexString = bgColour.charAt(0) == "#" ? bgColour.substring(1, 7) : bgColour;
		const r = parseInt(hexString.substring(0, 2), 16);
		const g = parseInt(hexString.substring(2, 4), 16);
		const b = parseInt(hexString.substring(4, 6), 16);

		return ((r * 0.299) + (g * 0.587) + (b * 0.114)) > 210;
	},
	getColourDataByColourId(colourId) {
		return this.colours.find(colour => colour.id == colourId);
	},

	showModal(type, content) {
		const split = type.split(":");
		this.modalType = split.splice(0, 1);
		this.modalArgs = split;
		this.modal = content;
	},

	closeModal() {
		this.modalType = null;
	},

	updateActiveTimerIndex() {
		console.trace("hi")
		if (!this.activeTimer) this.activeTimerIndex = null;
		this.activeTimerIndex = this.timers.findIndex(a => a.id == this.activeTimer);
	},

	timerOptionsMenu(timerId) {
		const timerIndex = this.timers.findIndex(a => a.id == timerId);
		const timer = this.timers[timerIndex];

		this.showModal("menu", {
			timer
		});
	},

	storeElapsed(timer) {
		const elapsedMillis = Date.now() - timer.started;
		timer.millisCounter += elapsedMillis;
		console.log(this.timers);
	},

	resume(timerId) {
		if (this.activeTimer) {
			this.storeElapsed(this.timers[this.activeTimerIndex]);
		}

		this.activeTimer = timerId;
		this.updateActiveTimerIndex();

		const timer = this.timers[this.activeTimerIndex];

		timer.started = Date.now();

		this.saveState();
	},

	pause(timerId) {
		this.storeElapsed(this.timers[this.activeTimerIndex]);

		this.activeTimer = null;
		this.updateActiveTimerIndex();

		this.saveState();
	},

	resetTimer(timerId) {
		const timerIndex = this.timers.findIndex(a => a.id == timerId);
		const timer = this.timers[timerIndex];

		timer.millisCounter = 0;

		this.saveState();
		this.closeModal();
	},

	removeTimer(timerId) {
		const timerIndex = this.timers.findIndex(a => a.id == timerId);

		this.timers.splice(timerIndex, 1);

		this.saveState();
		this.closeModal();
	},

	newTimer() {
		const nextUnusedColour = this.colours.find(colour => this.timers.findIndex(timer => timer.colour == colour.id) == -1)?.id || "red";

		this.timers.push({
			id: this.uuid(),
			label: "",
			millisCounter: 0,
			started: Date.now(),
			colour: nextUnusedColour
		});

		this.saveState();
	},

	updateTimerColor() {
		const modalTimerIndex = this.timers.findIndex(a => a.id == this.modal.timer.id);

		this.timers[modalTimerIndex].colour = this.modal.timer.colour;

		this.saveState();
	},

	saveState() {
		const data = {
			activeTimer: this.activeTimer,
			timers: this.timers
		};

		localStorage.setItem("timers", JSON.stringify(data));
	},

	mounted() {
		const params = new URL(location.href).searchParams;

		const rawData = localStorage.getItem("timers");
		if (rawData) {
			const data = JSON.parse(rawData);

			this.timers = data.timers;
			this.activeTimer = data.activeTimer;
			this.updateActiveTimerIndex();
		}

		window.addEventListener("keydown", e => {
			if (e.key == "Escape") {
				this.closeModal();
			} else if (e.key == "Enter" && this.modalType == "input") {
				this.modal.done();
			} else if (e.key == "Delete" && this.modalType == "subject") {
				this.removeSubject(this.modal.id);
			} else if (e.ctrlKey && e.key == "s") {
				this.saveSchedule();
				e.preventDefault();
			}
		});

		const frame = () => {
			if (this.activeTimer) {
				const timer = this.timers[this.activeTimerIndex];
				const elapsedMillis = Date.now() - timer.started;
				const totalMillis = timer.millisCounter + elapsedMillis;

				this.counterDisplay = this.timeDisplay(totalMillis);
				this.secsCounterDisplay = this.secsTimeDisplay(totalMillis);
			}

			requestAnimationFrame(frame);
		}
		frame();

		this.loaded = true;
	}
}).mount();

