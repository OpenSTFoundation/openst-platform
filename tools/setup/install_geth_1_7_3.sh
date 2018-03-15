#!/bin/bash
curl https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.7.3-4bb3c89d.tar.gz | tar xvz
mv geth-linux-amd64-1.7.3-4bb3c89d /usr/local/bin
ln -s /usr/local/bin/geth-linux-amd64-1.7.3-4bb3c89d/geth /usr/local/bin/geth
export PATH="$PATH:/usr/local/bin/geth-linux-amd64-1.7.3-4bb3c89d"