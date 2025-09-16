#!/bin/bash

apt update -y

apt install -y curl gnupg2 lsb-release

apt install unzip

curl -fsSL https://deb.nodesource.com/setup_18.x | bash -  
apt install -y nodejs

npm install -g serve

apt install -y tmux
