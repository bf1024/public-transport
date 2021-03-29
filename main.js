var protobuf = require("protobufjs");
var SlidingMarker = require('marker-animate-unobtrusive');
var worker;
var map;

const APP_CLASS = ".public-transport"
const START_BUTTON_CLASS = ".public-transport__button-start";
const STOP_BUTTON_CLASS = ".public-transport__button-stop";
const DROPDOWN_CLASS = ".public-transport__select";
const CORS_PROXY_ADDRESS = "https://radiant-forest-19340.herokuapp.com/";
const PUBLIC_TRANSPORT_API_ADDRESS = "https://www.ztm.poznan.pl/pl/dla-deweloperow/getGtfsRtFile/?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0ZXN0Mi56dG0ucG96bmFuLnBsIiwiY29kZSI6MSwibG9naW4iOiJtaFRvcm8iLCJ0aW1lc3RhbXAiOjE1MTM5NDQ4MTJ9.ND6_VN06FZxRfgVylJghAoKp4zZv6_yZVBu_1-yahlo&file=vehicle_positions.pb";
const applicationElements = document.querySelectorAll(APP_CLASS);

class publicTransport {
    constructor(element) {
        this.element = element;
        this.startButton = element.querySelector(START_BUTTON_CLASS);
        this.stopButton = element.querySelector(STOP_BUTTON_CLASS);
        this.dropdown = element.querySelector(DROPDOWN_CLASS);

        this.protobuf = protobuf;
        this.currentVehicle = 0;
        this.currentVehicleTitle = "";
        
        this.setDefaults();
        this.populateDropdown();
        this.bindEvents();

        setTimeout(()=> {
            this.initMap();
        }, 2000);
    }

    setDefaults() {
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
    }

    populateDropdown() {
        let httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = () => {
          if(httpRequest.readyState === 4)
          {
              var that = this;
              this.protobuf.load("test.proto").then(
                function(root){
                 let feedMessage = root.lookupType("FeedMessage");
               
                 let feed = feedMessage.decode(new Uint8Array(httpRequest.response));
                 
                 feed.entity.forEach(vehicle => {
                    that.dropdown.innerHTML += `<option value="${vehicle.vehicle.vehicle.id}">${vehicle.vehicle.vehicle.label}</option>`
                 });

                 that.dropdown.options[0].selected = true;
                 that.currentVehicleTitle = that.dropdown.options[that.dropdown.selectedIndex].text;
                 that.currentVehicle = that.dropdown.value;
                }
            );
          };
        }
        httpRequest.open("GET", CORS_PROXY_ADDRESS+PUBLIC_TRANSPORT_API_ADDRESS);
        httpRequest.responseType = "arraybuffer";
        httpRequest.send();
    }

    initMap() {
        map = undefined;
        const myLatlng = new google.maps.LatLng(52.406376,16.925167);
        const myOptions = {
            zoom: 13,
            center: myLatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
        }
        map = new google.maps.Map(document.getElementById("map"), myOptions);
        this.marker = new SlidingMarker({
            map: map,
            title: this.currentVehicleTitle,
            label: {
                text: this.currentVehicleTitle,
                fontSize: "17px"
            },
            duration: 12000,
            icon: {
                labelOrigin: new google.maps.Point(15, -8),
                url: './bus.png'
               }
        });
    }

    bindEvents() {
        this.startButton.addEventListener("click", ev => {
            this.startButton.disabled = true;
            this.stopButton.disabled = false;
            this.startWorker();
        });

        this.stopButton.addEventListener("click", ev => {
            this.startButton.disabled = false;
            this.stopButton.disabled = true;
            this.stopWorker();
        });

        this.dropdown.addEventListener("change", ev => {
            this.currentVehicleTitle = this.dropdown.options[this.dropdown.selectedIndex].text;
            this.currentVehicle = this.dropdown.value;
            this.setDefaults();
            this.initMap();
            this.stopWorker();

        });
    }

    startWorker() {
        if (typeof(worker) == "undefined") {
            worker = new Worker("./worker.js");
        }
        var that = this;
        this.protobuf.load("test.proto").then(
            function(root){
            let feedMessage = root.lookupType("FeedMessage");
           
            worker.onmessage = ev => {
             let feed = feedMessage.decode(ev.data);
             let vehicle = feed.entity.find(element => {
                return element.id == that.currentVehicle;
             });
             that.updateMarkers(vehicle.vehicle);
          };
        }
        );
    }

    stopWorker() {
        if(worker !== undefined) {
            worker.terminate();
            worker = undefined;
        }
    }

    updateMarkers(vehicle) {
            let latlng = new google.maps.LatLng(vehicle.position.latitude, vehicle.position.longitude);
            this.marker.setPosition(latlng);
            map.setCenter(latlng);
    }
}

const init = () => {
    applicationElements.forEach(element => {
        new publicTransport(element);
    });
}

setTimeout(() => {
    init();
}, 0);