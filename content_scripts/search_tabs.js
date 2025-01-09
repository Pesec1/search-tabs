/* global browser */

// NOTE: md2 hash for ids to ensure they are unique across DOM
const searchBarId = "FB97F8C18028D30F4D1F9BB40141C69C";
const inputId = "FB97F8C18028D30F4D1F9BB40141C69B";
const listId = "FB97F8C18028D30F4D1F9BB40141C69D";

// TODO: need to find better way to store css, do not really like to store them as string
// will become harder to manage as css styles grows but works for now
// TODO: needs better styles, right now is really bad
const searchBarCss = "position:absolute;width:100%;height:50%;opacity:0.4;z-index:100;";
const highlightSelection = "background-color: #ff0;";

// TODO: need a function to update those states and states of styles, it became to fucked to do it manually
let currentTab = 0;
let filteredTabs = [];
let isSearching = false;
let isInputFocused = true;
let lastKey;


async function startSearch() {
	isSearching = true;
	const tabsInfo = await browser.runtime.sendMessage({ "msg": "search_activated" });

	// TODO: need a better way to create inputs and list of tabs, need to research how to do this better

	// main div
	const searchBar = document.createElement("div");
	searchBar.id = searchBarId;
	searchBar.style.cssText = searchBarCss;

	// input
	const input = document.createElement("input");
	input.addEventListener("keyup", searchTabs);
	input.id = inputId;
	input.type = "text";
	searchBar.appendChild(input);

	// list of tabs
	const ol = document.createElement("ol");
	ol.id = listId;
	searchBar.appendChild(ol);
	tabsInfo.forEach((tab, index) => {
		let tabLink = document.createElement("li");
		tabLink.textContent = tab.title || tab.id;
		// TODO: need to change from storing tab.id in "href" to storing it in "id" attr
		// makes more sense by how it is used by program
		tabLink.setAttribute("href", tab.id);
		tabLink.style.cssText = index === 0 ? highlightSelection : "";

		filteredTabs.push(tabLink);
		ol.appendChild(tabLink);
	});

	document.body.append(searchBar);
	console.log('starting search');
};

function quitSearch() {
	isSearching = false;
	isInputFocused = true;
	currentTab = 0;
	lastKey = "";
	filteredTabs = [];
	document.getElementById(searchBarId).remove();
	console.log("quiting search");
};

function searchTabs(event) {
	// TODO: make more complex search, calculate Levenshtein distance, warmpup tab when distance is close
	// Right now warming tab is in the back script when switching, but I think that is not ideal
	// Could slow down swtich speed
	if (event.code === "Enter") {
		browser.runtime.sendMessage({ "msg": "switch_tab", "meta": { "tabId": Number(filteredTabs[currentTab].getAttribute("href")) } });
		quitSearch();
		console.log("switching tab");
	} else if (event.code === "Escape" && isInputFocused) {
		document.getElementById(inputId).blur();
		isInputFocused = false;
		console.log('bluring input');
		return;
	} else if (!isInputFocused) {
		console.log("input is blured... skipping searching");
		return;
	}


	const input = document.getElementById(inputId).value.toUpperCase();
	const ol = document.getElementById(listId);
	const li = ol.getElementsByTagName("li");

	// TODO: need to test how this actually works
	// WARNING: trash code ahead, buckle up for the ride
	let i = 0;
	filteredTabs = [];
	currentTab = 0;
	for (const [key, value] of Object.entries(li)) {
		if (value.innerHTML.toUpperCase().indexOf(input) > -1) {
			li[key].style.cssText = "";
			li[key].style.display = "";
			filteredTabs.push(li[key]);
			if (i === 0) {
				li[key].style.cssText = highlightSelection;
				i++;
			}
		} else {
			li[key].style.cssText = "";
			li[key].style.display = "none";
		}
	}
	console.log("searching tab");
};

function selectTab(event) {
	switch (event.code) {
		// TODO: need to test how this actually works
		// BUG: small bugs here with highlighting and order
		case "KeyK": // Up
			filteredTabs[currentTab].style.cssText = "";
			currentTab = currentTab > 0 ? --currentTab : 0;
			console.log(currentTab);
			filteredTabs[currentTab].style.cssText = highlightSelection;
			console.log('going up in search');
			break;
		case "KeyJ": // Down
			filteredTabs[currentTab].style.cssText = "";
			currentTab = currentTab < filteredTabs.length - 1 ? ++currentTab : filteredTabs.length - 1;
			console.log(currentTab);
			filteredTabs[currentTab].style.cssText = highlightSelection;
			console.log('going down in search');
			break;
		case "KeyI":
			isInputFocused = true;
			console.log('bluring going down');
			break;
		case "Enter":
			browser.runtime.sendMessage({ "msg": "switch_tab", "meta": { "tabId": Number(filteredTabs[currentTab].getAttribute("href")) } });
			quitSearch();
			console.log("switching tab");
			break;
	}
};

addEventListener("keydown", async (event) => {
	console.log(currentTab);
	if (event.code === "KeyP" && event.altKey && !isSearching) {
		startSearch();
	} else if (event.code == "Escape" && lastKey === "Escape" && isSearching) {
		quitSearch();
	} else if (document.getElementById(inputId) && isSearching && isInputFocused) {
		document.getElementById(inputId).focus();
	} else if (!isInputFocused) {
		selectTab(event);
	}
	lastKey = event.code;
});
