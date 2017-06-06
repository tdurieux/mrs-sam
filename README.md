# Mrs-Sam Headless Crawler

Mrs-Sam is a headless JS Crawler that automatically crawls any website to construction a sitemap.

## Installation

Clone the repository and perform `npm install` in the cloned folder.
If you want to crawl our test server, perform `npm install` in `server/test` as well.

## Usage

To run a minute random crawl of an URL:

    node index.js --options=[string] --url=[string] --out=[string]


* --options: the configuration file (default is options.js)
* --url: the url of the website you want to crawl (ex: http://localhost:8080)
* --out: the prefix of the output file(s)

## Result

A graph of the website can be observed (http://localhost:8080/map.html) by running the test server !


## Docker

Mrs Sam is coming with a Docker compose installer.

Go to the docker directory and run:

    docker-compose up 

Then you can play with Mrs Sam front-end (http://localhost:8080/map.html).

