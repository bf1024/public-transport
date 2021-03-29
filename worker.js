var self = this;
const CORS_PROXY_ADDRESS = "https://radiant-forest-19340.herokuapp.com/";

const retriveData = _ => {
  // GET DATA
  let httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = () => {
    if(httpRequest.readyState === 4)
    {
        self.postMessage(new Uint8Array(httpRequest.response));
    };
  }
  httpRequest.open("GET", CORS_PROXY_ADDRESS+"https://www.ztm.poznan.pl/pl/dla-deweloperow/getGtfsRtFile/?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0ZXN0Mi56dG0ucG96bmFuLnBsIiwiY29kZSI6MSwibG9naW4iOiJtaFRvcm8iLCJ0aW1lc3RhbXAiOjE1MTM5NDQ4MTJ9.ND6_VN06FZxRfgVylJghAoKp4zZv6_yZVBu_1-yahlo&file=vehicle_positions.pb");
  httpRequest.responseType = "arraybuffer";
  // httpRequest.setRequestHeader("Access-Control-Allow-Origin","*");
  httpRequest.send();
  
  setTimeout("retriveData()", 8000);
}

retriveData();