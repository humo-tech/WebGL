FROM node:lts-slim as runtime
WORKDIR /development

COPY app app

RUN apt-get update -y
RUN apt-get install git vim -y

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
