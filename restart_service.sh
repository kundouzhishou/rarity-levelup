echo "stop service ..."
ps -ef | grep run.js | grep -v grep | awk '{print $2}' | xargs kill -9
sleep 1
echo "start service ..."
nohup node run.js >>debug.log 2>&1 &