FROM ubuntu:17.10
MAINTAINER Xavier Blanc <blancxav@gmail.com>

# Git 
RUN apt-get update -y \
	&& apt-get install git -y 
	
# Install node
RUN apt-get update -y \
	&& apt-get install curl -y
RUN curl -o /usr/local/bin/n https://raw.githubusercontent.com/visionmedia/n/master/bin/n
RUN chmod +x /usr/local/bin/n
RUN n latest


RUN adduser --quiet --disabled-password --shell /bin/bash --home /home/nodeweb --gecos "User" nodeweb

USER nodeweb
RUN mkdir /tmp/Node
WORKDIR /tmp/Node
ADD run.sh .

CMD ["bash","./run.sh"]