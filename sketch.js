// ml5.js: Pose Classification
// The Coding Train / Daniel Shiffman
// https://thecodingtrain.com/Courses/ml5-beginners-guide/7.2-pose-classification.html
// https://youtu.be/FYgYyq-xqAw

let video;
let poseNet;
let pose;
let skeleton;

let brain;
let poseLabel = "";

let state = 'waiting';
let targetLabel;

let seriously;
let src;
let target;

function keyPressed() {
  if (key == 't') {
    brain.normalizeData();
    brain.train({
      epochs: 50
    }, finished);
  } else if (key == 's') {
    brain.saveData();
  } else if (key == 'c') {
    // c for collect data, label the data from user input
    targetLabel = prompt("Please enter the label", "");
    console.log(targetLabel);
    setTimeout(function() {
      console.log('collecting');
      state = 'collecting';
      setTimeout(function() {
        console.log('not collecting');
        state = 'waiting';
      }, 20000); // how long it is collecting
    }, 3000); // time before collecting
  }
}

function setup() {
  canvas = createCanvas(1500, 1000, WEBGL);
  canvas.id('p5canvas');
  video = createCapture(VIDEO);
  video.hide();
  video.id('webcam');
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);

  let options = {
    inputs: 34,
    outputs: 4,
    task: 'classification',
    debug: true
  }
  brain = ml5.neuralNetwork(options);

  // LOAD PRETRAINED MODEL
  // Uncomment to train your own model!
  const modelInfo = {
    model: 'model/model.json',
    metadata: 'model/model_meta.json',
    weights: 'model/model.weights.bin',
  };

  seriously = new Seriously();
  brain.load(modelInfo, brainLoaded);


  //LOAD TRAINING DATA
  // brain.loadData('dance_moves.json', dataReady);
}

function brainLoaded() {
  console.log('pose classification ready!');
  classifyPose();
}

function classifyPose() {
  if (pose) {
    let inputs = [];
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      inputs.push(x);
      inputs.push(y);
    }
    brain.classify(inputs, gotResult);
  } else {
    setTimeout(classifyPose, 100);
  }
}

// // Deploying
function gotResult(error, results) {
  if (results[0].confidence > 0.75) {
    poseLabel = results[0].label.toUpperCase();
  }
  classifyPose();
}

// // Loading data
function dataReady() {
  brain.normalizeData();
  brain.train({
    epochs: 100
  }, finished);
}

function finished() {
  console.log('model trained');
  brain.save();
  classifyPose();
}


function gotPoses(poses) {
  // console.log(poses); 
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
    if (state == 'collecting') {
      let inputs = [];
      for (let i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      let target = [targetLabel];
      brain.addData(inputs, target);
    }
  }
}

function modelLoaded() {
  console.log('poseNet ready');
}


function draw() {
  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0, video.width, video.height);

  src = seriously.source('#webcam');
  target = seriously.target('#p5canvas');
  
  var effect;

  if (poseLabel.localeCompare("DAB") == 0) {
    effect = seriously.effect('blur');
  } else if (poseLabel.localeCompare("WHIP") == 0) {
    effect = seriously.effect('ripple');
  } else if (poseLabel.localeCompare("SHOOT") == 0) {
    effect = seriously.effect('pixelate');
  } else if (poseLabel.localeCompare("WOAH") == 0) {
    effect = seriously.effect('kaleidoscope');
  } else {
    effect = seriously.effect('none');
  }
  
  effect.source = src;
  target.source = effect;
  seriously.go();

  pop();
}