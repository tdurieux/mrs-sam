# Mrs-Sam Page : A crawler for fetching a huge set of web pages

Mrs-Sam Page is a distributed crawler designed to crawl any web site and to fetch huge sets of web pages.

## Installation

Clone the repository and perform `npm install` in the page folder.

Mrs-Sam Page is composed of a master and several slave.

## Run the Master

Mrs-Sam Page is coming with a Docker compose installer.

Go to the page/docker directory and run:

    docker-compose build

Then run:

	docker-compose up 

Mrs-Sam Page is then running !

## Use the Web GUI

When the master is running, you can reach the Web GUI by using your browser (http://localhost:8080)

Thanks to the Web GUI you can crawl any given web site with some slaves (3 is a good start).

## Run the Slave

Go to the page directory and run

    npm install

    node ./slaveCLI.js 


It will ask you to choose for  which active crawl you want to create a slave.

Slaves can run on any computer with:

	node ./slaveCLI.js --master=IP_OF_THE_MASTER


## See the results

The Master contains a MongoDB and a file server (SFTP).

You can use RoboMongo or FileZilla to connect them and to get the results.



