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
		}

		data = filterFunction(data, blacklist[filter]);
	});

	return data;
}

function filterStreamers(data, streamerList) {
	return data.filter(stream => {
		const isBlacklisted = streamerList.includes(stream.channel.user.username);
		if (isBlacklisted) {
			console.log(`Filtering out blacklisted streamer '${stream.channel.user.username}'`);
		}
		return !isBlacklisted;
	});
}

function filterTags(data, tagsList) {
	return data.filter(stream => {
		var streamTags = [];

		for (var categoryObject of stream.categories) {
			streamTags = streamTags.concat(categoryObject.tags);
		}

		for (var tag of streamTags) {
			var isBlacklisted = includesAny(tag, tagsList);
			if (isBlacklisted) {
				console.log(`Filtering out streamer '${stream.channel.user.username}' due to tag '${tag}'`);
				return !isBlacklisted;
			}
		}
		return true;
	});
}
