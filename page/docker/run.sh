#!/bin/bash
mkdir work
cd work
git clone https://github.com/xblanc33/mrs-sam.git
ls 
cd mrs-sam
npm install
node ./site_crawler/master.js