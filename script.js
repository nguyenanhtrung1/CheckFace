
const container = document.querySelector('#container');
const fileInput = document.querySelector('#file-input');
let table2 = document.querySelector('table')
let buttonAdd = document.querySelector('#add')

async function loadTrainingData() {
	const labels = ['dat', 'sếp', 'thy', 'trung','minh']

	const faceDescriptors = []
	for (const label of labels) {
		const descriptors = []
		for (let i = 1; i <= 2; i++) {
			const image = await faceapi.fetchImage(`https://raw.githubusercontent.com/nguyenanhtrung1/CheckFace/main/labels/${label}/${i}.jpg`)
			const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor()
			descriptors.push(detection.descriptor)
		}
		faceDescriptors.push(new faceapi.LabeledFaceDescriptors(label, descriptors))
		Toastify({
			text: `Load data success : ${label}!`
		}).showToast();
	}

	return faceDescriptors
}

let faceMatcher
async function init() {
	await Promise.all([
		faceapi.nets.ageGenderNet.loadFromUri("/models"),
		faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
		faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
		faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
		faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
		faceapi.nets.faceExpressionNet.loadFromUri('/models')
	])

	Toastify({
		text: "Tải xong model nhận diện!",
	}).showToast();

	const trainingData = await loadTrainingData()
	faceMatcher = new faceapi.FaceMatcher(trainingData, 0.6)

	console.log(faceMatcher)
	document.querySelector("#loading").remove();
}

init()
fileInput.addEventListener('change', async () => {
	const files = fileInput.files;
	const image = await faceapi.bufferToImage(files[0]);
	const canvas = faceapi.createCanvasFromMedia(image);
	canvas.getContext("2d", {
		willReadFrequently: true,
   });

	container.innerHTML = ''
	container.append(image);
	container.append(canvas);

	const size = {
		width: image.width,
		height: image.height
	}

	faceapi.matchDimensions(canvas, size)

	const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors().withAgeAndGender().withFaceExpressions()
	const resizedDetections = faceapi.resizeResults(detections, size)
	faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

	const numberOfFaces = detections.length;
	console.log(`Số lượng thành viên nhận diện : ${numberOfFaces} || Thời gian :  ${new Date().toLocaleString()}`)
	
	for (const detection of resizedDetections) {
		const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
			label: faceMatcher.findBestMatch(detection.descriptor).toString()
		})
		drawBox.draw(canvas)

		const expressions = detection.expressions;
		let highestExpression = null;
		let highestProbability = 0;
		Object.entries(expressions).forEach(([expression, probability]) => {
		  if (probability > highestProbability) {
			highestExpression = expression;
			highestProbability = probability;
		  }
		});
		console.log(faceMatcher.findBestMatch(detection.descriptor).toString() + " "+ highestExpression);
		// buttonAdd.addEventListener('click',() =>{
		// 	// let name = "trung"
		// 	// let age = 18
		// 	// let time = "21/04/2002"
		// 	let template = `<tr>
		// 		<td>${faceMatcher.findBestMatch(detection.descriptor).toString()}</td>
		// 		<td>${highestExpression}</td>
		// 		<td>${new Date().toLocaleString()}</td>
		// 	</tr>`;
		// table.innerHTML += template
		// })
		let template = `<tr>
				<td>${faceMatcher.findBestMatch(detection.descriptor).toString()}</td>
				<td>${highestExpression}</td>
				<td>${new Date().toLocaleString()}</td>
			</tr>`;
			table2.innerHTML += template
	}
	resizedDetections.forEach(result => {
		const {age, gender} = result;
		const genderText = gender === "male" ? "male : Nam" : "male : Nữ";
		new faceapi.draw.DrawTextField ([
			`${Math.round(age,0)} Tuổi`,
			`${genderText}`
		],
		result.detection.box.topRight
		).draw(canvas);
	  })
	  
	// setTimeout(() => {
    //     alert(`Số lượng khuôn mặt trong ảnh : ${numberOfFaces} || Thời gian : ${new Date().toLocaleString()}`);	
    // }, 1000);
})
let exportExcel = document.querySelector('#export');
const filePath = "A:/PartTimeTrain/Database/Trung/File/";
const fileName = "data";

exportExcel.addEventListener('click', () => {

  const table2excel = new Table2Excel();
  table2excel.export(table2, fileName, filePath);
});
