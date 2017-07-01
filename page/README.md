# Mrs-Sam Page : A crawler for fetching a huge set of web pages

Mrs-Sam Page is a distributed crawler designed to crawl any web site and to fetch huge sets of web pages.

## Installation

Clone the repository and perform `npm install` in the page folder.

Mrs-Sam Page is composed of a master and several slave.

## Run the Master

Mrs-Sam Page is coming with a Docker compose installer.

Go to the docker directory and run:

    docker-compose up 


## Run the Slave

    npm install

    node slaveFetcher --oid="5957543349566c055c25742e"

Where 5957543349566c055c25742e is the ids returned by the master


