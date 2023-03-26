import time
from datetime import datetime
from RmcsDatabase import Database, DataCommon
import config
import RPi.GPIO

gpio = RPi.GPIO
gpio.setmode(RPi.GPIO.BCM)
gpio.setwarnings(False)
warning_pin = 24
danger_pin = 26
gpio.setup(warning_pin, gpio.OUT)
gpio.setup(danger_pin, gpio.OUT)

# Set database configuration with custom config file and connect to database
Database.setConfig(config.DATABASE_CONFIG)
if not Database.connect() :
    raise Database.debug
print("Connected to local database server")

gpio.output(warning_pin, gpio.LOW)
gpio.output(danger_pin, gpio.LOW)

alert_duration = 30
alert_time = time.time()

# Set warning and danger threshold
warning_h_temperature = 40
danger_h_temperature = 60
warning_h_inclination = 10
danger_h_inclination = 30

# Device ID and data index for temperature and inclination
id_temperature = (0,1,7)
id_inclination = (0,1,4)
index_temperature = 0
index_inclination = 0

while True :

    # Get temperature data from database
    data = DataCommon.selectNumber(id_temperature, ("data",), datetime.now(), -1)
    temperature = None
    if len(data):
        temperature = data[0]["data"][index_temperature]

    # Get inclination data from database
    data = DataCommon.selectNumber(id_inclination, ("data",), datetime.now(), -1)
    inclination = None
    if len(data):
        inclination = data[0]["data"][index_inclination]

    # Show current temperature and inclination
    print("temperature: {0:6.2f}°C\tinclination: {1:7.3f}°".format(temperature, inclination))

    # Check temperature and inclination value to determine warning and danger status
    if temperature > danger_h_temperature or inclination > danger_h_inclination:
        alert_time = time.time()
        gpio.output(danger_pin, gpio.HIGH)
    elif temperature > warning_h_temperature or inclination > warning_h_inclination:
        alert_time = time.time()
        gpio.output(warning_pin, gpio.HIGH)
        gpio.output(danger_pin, gpio.LOW)
    elif (time.time() - alert_time) > alert_duration :
        gpio.output(warning_pin, gpio.LOW)
        gpio.output(danger_pin, gpio.LOW)

    # Reconnect to database server
    time.sleep(5)
    Database.connect()
