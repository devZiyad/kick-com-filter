// ==UserScript==
// @name         Filter Kick.com
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Intercept API calls to Kick.com and filter out blacklisted streamers
// @author       devZiyad
// @match        *://kick.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==


const blacklist = {
	"streamer": [],
	"tag": [],
	"category": [],
};

const api_urls = [
	"/stream/featured-livestreams/en",
	"/stream/livestreams/en"
];

(function() {
	'use strict';

	console.log("Running kick.com filter script");	

	// Override fetch calls
	const originalFetch = window.fetch;
	window.fetch = function(url, options) {
		console.log(`Intercepted fetch request to: ${url}`);
		if (includesAny(url, api_urls)) {
			return originalFetch(url, options).then(response => {
				console.log("Original fetch response received");

				// Clone response to modify
				var clonedResponse = response.clone();

				return clonedResponse.json().then(responseJSON => {
					console.log("Original fetch response JSON", responseJSON);

					// Filter responseJSON
					if (responseJSON.data) {
						responseJSON.data = filterData(responseJSON.data);
					}

					// Create new response with filtered data
					const filteredResponse = new Response(JSON.stringify(responseJSON), {
						status: response.status,
						statusText: response.statusText,
						headers: response.headers
					});
					console.log("Filtered fetch response JSON: ", responseJSON);
					return filteredResponse;
				});
			});
		} else {
			return originalFetch(url, options);
		}
	};

	// Override XMLHttpRequest calls
	const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();

        const originalOpen = xhr.open;
        const originalSend = xhr.send;

        xhr.addEventListener('readystatechange', function() {
            if (xhr.readyState === 4 && includesAny(xhr.responseURL, api_urls)) {
                console.log(`Intercepted XMLHttpRequest to: ${xhr.responseURL}`);
                const originalResponse = xhr.responseText;
                try {
                    console.log('Original XMLHttpRequest response:', originalResponse);
                    var responseJSON = JSON.parse(originalResponse);
                    if (responseJSON.data) {
						responseJSON.data = filterData(responseJSON.data);
                    }

                    // Define a writable `responseText` property
                    Object.defineProperty(xhr, 'responseText', {
                        writable: true
                    });

                    // Update the internal responseText to the filtered data
                    xhr.responseText = JSON.stringify(responseJSON);

                    console.log('Filtered XMLHttpRequest response:', xhr.responseText);
                } catch (e) {
                    console.error('Failed to parse JSON response:', e);
                }
            }
        });

        return xhr;
    };
})();


// Utility Functions
function includesAny(str, arr) {
	return arr.some(subStr => {
		return str.includes(subStr)
	});
}

// Filtering Functions

function filterData(data) {
	var filters = Object.keys(blacklist);
	filters.forEach(filter => {
		var filterFunction;
		switch (filter) {
			case "streamer":
				filterFunction = filterStreamers;
				break;
			case "tag":
				filterFunction = filterTags;
				break;
			case "category":
				filterFunction = filterCategory;
				break;
		}

		data = filterFunction(data, blacklist[filter]);
	});

	return data;
}

function filterStreamers(data, streamerList) {
	const lowerCaseStreamers = streamerList.map(streamer => streamer.toLowerCase());
	return data.filter(stream => {
		const lowerCaseUsername = stream.channel.user.username.toLowerCase();
		const isBlacklisted = lowerCaseStreamers.includes(lowerCaseUsername);
		if (isBlacklisted) {
			console.log(`Filtering out blacklisted streamer '${stream.channel.user.username}'`);
		}
		return !isBlacklisted;
	});
}

function filterTags(data, tagsList) {
	const lowerCaseTagsList = tagsList.map(tag => tag.toLowerCase());
	return data.filter(stream => {
		var streamTags = [];

		for (var categoryObject of stream.categories) {
			streamTags = streamTags.concat(categoryObject.tags);
		}

		for (var tag of streamTags) {
			const lowerCaseTag = tag.toLowerCase();
			var isBlacklisted = lowerCaseTagsList.includes(lowerCaseTag);
			if (isBlacklisted) {
				console.log(`Filtering out streamer '${stream.channel.user.username}' due to tag '${tag}'`);
				return false;
			}
		}
		return true;
	});
}

function filterCategory(data, categoryList) {
	const lowerCaseCategoryList = categoryList.map(category => category.toLowerCase());
	return data.filter(stream => {
		var streamCategories = [];

		for (var categoryObject of stream.categories) {
			streamCategories = streamCategories.concat(categoryObject.name);
		}

		for (var categoryName of streamCategories) {
			const lowerCaseCategoryName = categoryName.toLowerCase();
			var isBlacklisted = lowerCaseCategoryList.includes(lowerCaseCategoryName);
			if (isBlacklisted) {
				console.log(`Filtering out streamer '${stream.channel.user.username}' due to category '${categoryName}'`);
				return false;
			}
		}
		return true;
	});
}
