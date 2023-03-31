#!/usr/bin/sh

while :
do

	ews=$(pgrep -a python3 | grep -c /home/pi/EWS_POC/gateway_ews/ews.py)
	if [ $ews -eq 0 ]
	then

		printf "rerun gateway EWS program...\n"
		python3 /home/pi/EWS_POC/gateway_ews/ews.py &

	fi

	sleep 300

done
