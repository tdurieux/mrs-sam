FROM ubuntu:17.10
MAINTAINER Xavier Blanc <blancxav@gmail.com>


#RUN apt-get update -y \
#	&& apt-get install nodejs npm -y\
#	&& apt-get install git -y	
#RUN ln -s `which nodejs` /usr/bin/node

RUN apt-get update -y \
	&& apt-get install git -y \
	&& apt-get install curl -y
	
RUN curl -o /usr/local/bin/n https://raw.githubusercontent.com/visionmedia/n/master/bin/n

RUN chmod +x /usr/local/bin/n

RUN n latest


RUN adduser --quiet --disabled-password --shell /bin/bash --home /home/nodeweb --gecos "User" nodeweb

USER nodeweb
RUN mkdir /tmp/Node
WORKDIR /tmp/Node
ADD run.sh .

EXPOSE 8080

CMD ["bash","./run.sh"]