import { Auth, setConfig, getResult, getStatus, saveToken } from "@gundala/api";
import { DataCommon } from "@gundala/api-rmcs";
import { format } from "date-fns";

// API URL configuration
const config = {
  url_auth : "https://api.gundala.co.id/auth",
  url_rmcs : "https://api.gundala.co.id/shms",
  url_shms : "https://api.gundala.co.id/shms"
}
const application = "shms";
setConfig(config);

// Alert freeze time. Alert message only sent after freeze time passed
let alert_freeze = 600000   // 600 seconds
let alert_time_warning = new Date() - alert_freeze;
let alert_time_danger = new Date() - alert_freeze;

// Alert status
let status_warning = false;
let status_danger = false;

// Set warning and danger threshold
let warning_h_temperature = 40;
let danger_h_temperature = 60;
let warning_h_inclination = 10;
let danger_h_inclination = 30;

// Device ID and data index for temperature and inclination
let id_temperature = [0,1,7];
let id_inclination = [0,1,4];
let index_temperature = 0;
let index_inclination = 0;

// Login using guest user
async function guestLogin(application) {
    let tryLogin = setTimeout(async function login() {
        let response = await Auth.guest(application);
        if (getResult(response)) {
            console.log("Guest login success");
            saveToken(response);
        } else {
            console.log("Login failed");
            tryLogin = setTimeout(login, 1000);
        }
    }, 1000);
}

// Try to login for the first time
await guestLogin(application);

let run = setTimeout(async function ews() {
    const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    status_warning = false;
    status_danger = false;

    // Get temperature data from API
    let temperature = null;
    let response = await DataCommon.selectNumber(id_temperature, ["data"], timestamp, -1);
    let result = getResult(response);
    if (result.length) {
        temperature = result[0]["data"][index_temperature];
        // Set warning and danger status for temperature
        status_warning = status_warning || (temperature > warning_h_temperature);
        status_danger = status_danger || (temperature > danger_h_temperature);
    }

    // Get inclination data from API
    let inclination = null;
    response = await DataCommon.selectNumber(id_inclination, ["data"], timestamp, -1);
    result = getResult(response);
    if (result.length) {
        inclination = result[0]["data"][index_inclination];
        // Set warning and danger status for inclination
        status_warning = status_warning || (inclination > warning_h_inclination);
        status_danger = status_danger || (inclination > danger_h_inclination);
    }

    // Show current temperature and inclination
    console.log(timestamp + "\ttemperature: " + temperature + "°C\tinclination: " + inclination + "°");

    // Check for temperature and inclination status
    let now = new Date();
    if (status_danger && (now - alert_time_danger) > alert_freeze) {
        alert_time_danger = new Date();
        status_danger = false;

        // Send danger alert message
        console.log("DANGER!!!");


    } else if (status_warning && (now - alert_time_warning) > alert_freeze) {
        alert_time_warning = new Date();
        status_warning = false;

        // Send warning alert message
        console.log("WARNING!!!");


    }

    // Relogin if guest token expire
    if (getStatus(response) == "INVALID_TOKEN") {
        await guestLogin(application);
    }

    // Run every 5 seconds
    run = setTimeout(ews, 5000);
}, 5000);
