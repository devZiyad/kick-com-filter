# Kick.com Filter Script

## Description

This is a [Tampermonkey](https://www.tampermonkey.net/) user script designed to intercept API calls to Kick.com and filter out blacklisted streamers. The script modifies responses from specific API endpoints to remove data related to blacklisted streamers before it reaches the client.

## Features

- **Intercepts XMLHttpRequest calls**: Adjusts responses to filter out blacklisted streamers.
- **Customizable Blacklist**: Easily configure which streamers to blacklist.

## Installation

1. **Install Tampermonkey Extension**: Ensure you have the Tampermonkey extension installed in your browser. You can download it from [Tampermonkey's website](https://www.tampermonkey.net/).

2. **Add the User Script**:
    - Open Tampermonkey dashboard.
    - Click on the **+** (Add a new script) button.
    - Copy the contents of the `main.js` file (provided below) and paste it into the Tampermonkey editor.
    - Save the script.

## Usage

1. **Configuration**:
   - **Blacklist**: Modify the `blacklist` object in the script to include usernames you want to filter out.
   - **API URLs**: The script currently filters API calls to `/stream/featured-livestreams/en` and `/stream/livestreams/en`. Adjust the `api_urls` array if additional endpoints need filtering.

2. **Enjoy**:
   - Open [Kick.com](https://kick.com) in your browser.
   - Interactions with blacklisted streamers should now be filtered out from the API responses.

## Blacklist Example
```javascript
const blacklist = {
    "streamer": [
        "streamer1_username",
        "streamer2_username",
    ],
    "tag": [
        "Gambling",
        "Tag2",
    ],
    "category": [
        "Counter-Strike 2",
    ],
};
```
