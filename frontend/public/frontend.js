document.getElementById("add-button").addEventListener("click", handleAddButton);
document.getElementById("query-button").addEventListener("click", handleQueryButton);
document.getElementById("zip-file-input").addEventListener("change", readFileContent);

document.getElementById("prev").addEventListener("click",prevPage);
document.getElementById("next").addEventListener("click", nextPage);

const listOfDatasets = document.getElementById("dataset-list-container");

const gtButton = document.getElementById(">=");
const eqButton = document.getElementById("==");
const ltButton = document.getElementById("<=");

const datasetNameInput = document.getElementById("dataset-name");
const queryNumberInput = document.getElementById("dataset-value");

const zipFile = document.getElementById("zip-file-input");
const zipFileName = document.getElementById("name-value");

const queryTable = document.getElementById("result-table");
const pageNumber = document.getElementById("page-number");

let storedZipFile;
let currentQueryResult;
let currentQueryPage;
let currentMaxSize;

function nextPage() {
	if (currentQueryPage < currentMaxSize) {
		currentQueryPage++;
		setQuery();
	}
}

function prevPage() {
	if (currentQueryPage !== 1) {
		currentQueryPage--;
		setQuery();
	}
}

function readFileContent(event) {
	let file = event.target.files[0];
	const fileReader = new FileReader();

	fileReader.addEventListener("load",  (foo) => {
	storedZipFile = fileReader.result;
	});
	fileReader.readAsArrayBuffer(file);
}

function validateAddSetting() {
	if (zipFile.value.length < 1) {
		return false;
	}
	const replaceValue = zipFile.value.replace(/\//g,' ');
	let valueArray = zipFile.value.split(" ");
		console.log(valueArray);
	console.log(zipFile.value);
	if (zipFileName.value.length < 1) {
		return false;
	}
	return true;
}


function handleAddButton() {
	if(!validateAddSetting()) {
		alert("Please input a zip file and its name")
		return;
	}

	const returnValue = fetch("./dataset/" + zipFileName.value + "/pairadd", {
		method: "PUT",
		headers: {'Content-Type': 'application/json'},
	});

	returnValue.then(response => response.json()).then(value => {
		const valueArray = value.result;
		if (Array.isArray(valueArray)) {
			listOfDatasets.innerHTML = "";
			for (const dataset of valueArray) {
				let tempElement = document.createElement("li");
				tempElement.textContent = dataset + " ";
				listOfDatasets.append(tempElement);
			}
		} else {
			alert("ERROR! Dataset could not be added");
		}
	}).catch((error) => {
		alert("ERROR! Dataset could not be added");
	});
}

function handleQueryButton() {
	const verify = verifySetting();
	if (verify === false) {
		alert("Properly fill out the form to query an added dataset.");
		return;
	}

	const logicKey = verify["logic"];
	const numberValue = verify["number"];
	const datasetName = verify["datasetName"];


	const datasetNameObject = createDatasetValueObject(datasetName);

	let query = {
		"WHERE": {
			[logicKey]: {
				[datasetNameObject["avg"]]: numberValue
			}
		},
		"OPTIONS": {
			"COLUMNS": [
				datasetNameObject["dept"],
				datasetNameObject["id"],
				datasetNameObject["avg"],
				datasetNameObject["year"]
			],
			"ORDER": {
				"dir": "DOWN",
				"keys": [datasetNameObject["avg"]]
			}
		}
	};

	const returnValue = fetch("./query", {
		method: "POST",
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(query)
	});

	returnValue.then(response => response.json()).then((value) => {
		currentQueryResult = value.result;
		currentMaxSize = currentQueryResult.length/25;
		currentQueryPage = 1;

		setQuery();

	}).catch((error) => {
		alert("This dataset is not yet added.");
	});
}

function setQuery() {
	queryTable.innerHTML = "<table><tr><th><strong>AVG</strong></th><th><strong>Year</strong></th><th><strong>Department</strong></th><th><strong>ID</strong></th></tr></table>";

	for (let i = 0; i < 20; i++) {
		let tableRow = document.createElement("tr");
		let objectIndex = i + 25*(currentQueryPage-1);
		let currentObject = currentQueryResult[objectIndex];
		for (const result in currentObject) {
			let tableColumn = document.createElement("td");
			tableColumn.textContent = currentObject[result];
			tableRow.append(tableColumn);
		}
		queryTable.firstElementChild.append(tableRow);
	}

	let setText = "Page " + currentQueryPage;
	pageNumber.innerHTML = "<strong>" + setText + "</strong>";
}

function verifySetting() { // returns false or an object
	const radioButtonStatus = verifyRadioButtons();
	if (radioButtonStatus === false) {
		return false;
	}

	if (datasetNameInput.value.length < 1) {
		return false;
	}

	if (queryNumberInput.value.length < 1 || queryNumberInput.value > 100 || queryNumberInput.value < 0) {
		return false;
	}

	return {
		logic: radioButtonStatus,
		number: Number(queryNumberInput.value),
		datasetName: datasetNameInput.value
	};
}

function verifyRadioButtons() {
	if (ltButton.checked === true) {
		return "LT";
	} else if (gtButton.checked === true) {
		return "GT";
	} else if (eqButton.checked === true) {
		return "EQ";
	} else {
		return false;
	}
}

function verifyDatasetName(datasetName) {
	const textContent = listOfDatasets.textContent.trim(); // !!! listOfDatasets the id for the collection/container of the dataset lists
	const textArray = textContent.split(" ");

	for (let dataset of textArray) {
		if (datasetName === dataset) {
			return true;
		}
	}
	return false;
}

function createDatasetValueObject(datasetName) {
	return {
		"dept" : datasetName + "_dept",
		"id" : datasetName + "_id",
		"avg": datasetName + "_avg",
		"year": datasetName + "_year",
	}
}
