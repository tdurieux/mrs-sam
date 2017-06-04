#!/bin/bash
mkdir work
cd work
git clone https://github.com/xblanc33/mrs-sam.git
ls 
cd mrs-sam
npm install
xvfb-run --server-args="-screen 0 1024x768x24" node server.js mongo