#!/bin/bash
WORK_DIRECTORY="work"
if [[-d "$WORK_DIRECTORY"]]; then 
	mkdir "$WORK_DIRECTORY" 
fi

cd "$WORK_DIRECTORY"
git clone https://github.com/xblanc33/mrs-sam.git
ls 
cd mrs-sam/page
npm install
xvfb-run --server-args="-screen 0 1024x768x24" node ./server.js --mongo="mongo" --rabbit="rabbit" --ftp="vsftpd"