#!/bin/bash
curl https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.8.3-329ac18e.tar.gz | tar xvz
mv geth-linux-amd64-1.8.3-329ac18e /usr/local/bin
ln -s /usr/local/bin/geth-linux-amd64-1.8.3-329ac18e/geth /usr/local/bin/geth
export PATH="$PATH:/usr/local/bin/geth-linux-amd64-1.8.3-329ac18e"



