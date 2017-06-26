FROM python:3.6-rc
MAINTAINER Xavier Blanc <blancxav@gmail.com>

RUN pip install numpy scipy matplotlib pandas scikit-learn

# Installing the packages needed to run in headless
RUN apt-get update -y

RUN apt-get install -y \
  xvfb \
  x11-xkb-utils \
  xfonts-100dpi \
  xfonts-75dpi \
  xfonts-scalable \
  xfonts-cyrillic \
  x11-apps \
  clang \
  libdbus-1-dev \
  libgtk2.0-dev \
  libnotify-dev \
  libgnome-keyring-dev \
  libgconf2-dev \
  libasound2-dev \
  libcap-dev \
  libcups2-dev \
  libxtst-dev \
  libxss1 \
  libnss3-dev \
  gcc-multilib \
  g++-multilib


  # xvfb-run --server-args="-screen 0 1024x768x24" python cluster.py