#!/bin/bash
mkdir work
cd work
git clone https://github.com/xblanc33/mrs-sam.git
ls 
cd mrs-sam/page
npm install
node ./server.js --mongo="mongo" --rabbit="rabbit" --ftp="vsftpd"