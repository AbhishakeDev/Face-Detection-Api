const video = document.getElementById('video');
let predictedAges=[];

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
    faceapi.nets.faceExpressionNet.loadFromUri("./models"),
    faceapi.nets.ageGenderNet.loadFromUri("./models"),
]).then(startVideo);

function startVideo(){
    navigator.getUserMedia({video : {}},
        stream => (video.srcObject = stream),
        err => console.log(err)
    );
}
video.addEventListener("playing",() => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize ={
        width:video.width,
        height:video.height
    };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi
        .detectAllFaces(video,new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

        const resizedDetections = faceapi.resizeResults(detections,displaySize);

        canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);

        faceapi.draw.drawDetections(canvas,resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas,resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas,resizedDetections);
        
        // console.log(resizedDetections);
        const age = resizedDetections[0].age;
        const interpolatedAge = interpolatedAgePredictions(age);
        // console.log(interpolatedAge);
        const bottomRight = {
            x: resizedDetections[0].detection.box.bottomRight.x - 50,
            y: resizedDetections[0].detection.box.bottomRight.y
        }


        new faceapi.draw.DrawTextField(
            [`${faceapi.utils.round(interpolatedAge,0)}years`],
            bottomRight
        ).draw(canvas);
    },100);
});

function interpolatedAgePredictions (age) {
    predictedAges = [age].concat(predictedAges).slice(0,30);
    // console.log(predictedAges);
    const avgPredictedAge = 
    predictedAges.reduce((total,a) => (total+a))  /predictedAges.length;
    return avgPredictedAge;
}