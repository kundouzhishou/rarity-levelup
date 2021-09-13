echo "stop service ..."
ps -ef | grep main.js | grep -v grep | awk '{print $2}' | xargs kill -9
sleep 1
echo "start service ..."
nohup node main.js >>debug.log 2>&1 &