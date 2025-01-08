browser.runtime.onMessage.addListener((data, sender) => {
	console.log(data);
	if (data.msg === "search_activated") {
		return Promise.resolve(getTabsInfo());
	} else if (data.msg === "switch_tab") {
		console.log('got it', data.meta.tabId)
		return Promise.resolve(switchTab(data.meta.tabId));
	}
	return false;
});

function getTabsInfo() {
	return browser.tabs.query({});

}

function switchTab(tabId) {
	// NOTE: maybe we do not need warming since it is delaying switching
	const warming = browser.tabs.warmup(tabId);
	warming.then(browser.tabs.update(tabId, { "active": true }));
}
