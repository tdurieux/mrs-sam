FROM alpine:3.6
MAINTAINER Xavier Blanc <blancxav@gmail.com>

RUN apk update \
	&& apk add nodejs \
	&& apk add nodejs-npm \
	&& apk add git 

ADD run.sh .

EXPOSE 8080

CMD ["sh","./run.sh"]