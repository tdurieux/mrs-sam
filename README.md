# Mrs-Sam Headless Crawler

Mrs-Sam is a headless JS Crawler that automatically crawls any website to construction a sitemap.

## Installation

Clone the repository and perform `npm install` in the cloned folder.
If you want to crawl our test server, perform `npm install` in `server/test` as well.

## Usage

    node index.js --maxsteps=[num] --time=[num] --show=[boolean] --url=[string]


* --maxsteps (-m): the max number of steps performed by the crawler (default is 10)
* --time (-t): the time (in ms) for the crawler to crawl
* --show (-s): show the crawler (Nightmare)
* --url: the url of the website you want to crawl (ex: http://localhost:8080)

## Result

A graph of the website can be observed (http://localhost:8080/map.html) by running the test server !


