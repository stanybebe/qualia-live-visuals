var ccA = 0;
var ccB = 0;
var ccC = 0;
var ccD = 0;
var ccE = 0;
var ccF = 0;
var ccG = 0;
var ccH = 0;
var ccI = 0;
var obj;
var mobi;
var wobi;
var objswitch =0;
var tex3;

let lightPulse = 0.0;
let lightTarget = 0.0;

let ringRadius = 0.8;
let ringTarget = 0.8;

let yJitterAmt = 0.0;
let yJitterTarget = 0.0;
let yJitterSeed = 0.0;

function setup() {




  createCanvas(1920/2, 1080/2, WEBGL);
  tex3 = createGraphics(128, 128, WEBGL);

  
  textSize(width / 10);
  textAlign(LEFT, CENTER);
  // Enable WebMidi.js and trigger the onWebMidiEnabled() function when ready.
  WebMidi.enable()
    .then(onWebMidiEnabled)
    .catch(err => alert(err));

}


function preload() {
 myShader = loadShader("vertShader.vert", "texture.frag");
}


function draw() {

  // Bypass MIDI - set default values for testing
  ccE = 127;
  ccF = 127;
  ccG = 127;

  var mapccR = map(ccE, 0, 127, 0, 1);
  var mapccG = map(ccF, 0, 127, 0, 1);
  var mapccB = map(ccG, 0, 127, 0, 1);
// smooth toward targets
lightPulse = lerp(lightPulse, lightTarget, 0.45);
ringRadius = lerp(ringRadius, ringTarget, 0.35);
yJitterAmt = lerp(yJitterAmt, yJitterTarget, 0.4);

// decay targets (slow ramp out)
lightTarget *= 0.54;
ringTarget = lerp(ringTarget, 0.6, 0.08);   // faster return to base
yJitterTarget = lerp(yJitterTarget, 0.0, 0.15);

// send to shader
myShader.setUniform("u_lightPulse", lightPulse);
myShader.setUniform("u_ringRadius", ringRadius);
myShader.setUniform("u_yJitterAmt", yJitterAmt);
myShader.setUniform("u_yJitterSeed", yJitterSeed);
  background(0);
  myShader.setUniform("u_time", frameCount * 0.1);
  myShader.setUniform("u_resolution", [width*2, height*2]);
  myShader.setUniform("speed", 1.5);
  myShader.setUniform("amp", 1.0);
  myShader.setUniform("offset", 1.0);
  myShader.setUniform("red", mapccR);
  myShader.setUniform("green", mapccG);
  myShader.setUniform("blue", mapccB);
  push();
  noStroke();
  shader(myShader);
  rect(-width / 2, -height / 2, width, height);

  pop();
}

function onWebMidiEnabled() {

  // Check if at least one MIDI input is detected. If not, display warning and quit.
  if (WebMidi.inputs.length < 1) {
    alert("No MIDI inputs detected.");
    return;
  }

  // Add a listener on all the MIDI inputs that are detected
  WebMidi.inputs.forEach(input => {

    // When a "note on" is received on MIDI channel 1, generate a random color start
    input.channels[1].addListener("controlchange", cc => {

      if(cc.controller.number == 0){
        ccA = cc.value;
      }
      if(cc.controller.number == 1){
        ccB = cc.value;
      }
      if(cc.controller.number == 2){
        ccC = cc.value;
      }
      if(cc.controller.number == 3){
        ccD = cc.value;
      }
      if(cc.controller.number == 4){
        ccE = cc.value;
      }
      if(cc.controller.number == 5){
        ccF = cc.value;
      }
      if(cc.controller.number == 6){
        ccG = cc.value;
      }
      if(cc.controller.number == 7){
        ccH = cc.value;
      }
      if(cc.controller.number == 8){
        ccI = cc.value;
      }

      




     
    });
    input.channels[1].addListener("noteon", n => {
      const vel = n.velocity ?? 1.0; // WebMidi velocity is usually 0..1
      const note = n.note.number;    // 0..127

      lightTarget = max(lightTarget, 0.4 + vel * 1.8);
      ringTarget = map(vel, 0, 1, 0.15, 1.4, true);  // high vel = tight, low = spread
      yJitterTarget = map(vel, 0, 1, 0.01, 0.2, true);
      yJitterSeed = random(10000.0); // new random layout each hit
    });


  });

}
function mousePressed() {
  if (mouseX > 0 && mouseX < 100 && mouseY > 0 && mouseY < 100) {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}


