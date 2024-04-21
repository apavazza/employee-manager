// event listener for import button click
const importEmployeeDataButton = document.getElementById("import-employee-data");
importEmployeeDataButton.addEventListener("click", async function(){
    const fileInput = document.getElementById('file-input-employee');
    const file = fileInput.files[0];
    if(!file){
        alert("Please select a CSV file");
        return;
    }
    const csvData = await readCSV(file);
    const data = parseEmployeeCSV(csvData);
    importEmployeeCSVData(data);
});

const importPTODataButton = document.getElementById("import-pto-data");
importPTODataButton.addEventListener("click", async function(){
    const fileInput = document.getElementById('file-input-pto');
    const file = fileInput.files[0];
    if(!file){
        alert("Please select a CSV file");
        return;
    }
    const csvData = await readCSV(file);
    const data = parsePtoCSV(csvData);
    importPtoCSVData(data);
})

// function to import CSV data into IndexedDB
function importEmployeeCSVData(data) {
    const request = indexedDB.open('employee-db', 1);
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        objectStore = db.createObjectStore('employee', { autoIncrement: true });
        db.createObjectStore('pto', { autoIncrement: true });
    };
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['employee'], 'readwrite');
        const objectStore = transaction.objectStore('employee');
        let lastID = 0;
        for (const record of data) {
            if(record.id > lastID) lastID = record.id;
            objectStore.add({ id: Number(record.id), firstName: record.firstName, lastName: record.lastName, dateOfBirth: record.dateOfBirth, jobDescription: record.jobDescription });
        }
        transaction.oncomplete = function() {
            localStorage.setItem("last_id", lastID);
            alert('Data imported successfully');
            console.log('Data imported successfully');
        };
    };
}

// function to import CSV data into IndexedDB
function importPtoCSVData(data) {
    const request = indexedDB.open('employee-db', 1);
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        const objectStore = db.createObjectStore('employees', { autoIncrement: true });
        db.createObjectStore('pto', { autoIncrement: true });
    };
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['pto'], 'readwrite');
        const objectStore = transaction.objectStore('pto');
        for (const record of data) {
            objectStore.add({ id: Number(record.id), startDate: record.stardDate, endDate: record.endDate });
        }
        transaction.oncomplete = function() {
            alert('Data imported successfully');
            console.log('Data imported successfully');
        };
    };
}

// function to read the contents of a CSV file
function readCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// function to parse employee CSV data
function parseEmployeeCSV(csvData) {
    const rows = csvData.trim().split(/\r?\n/);
    const data = [];
    for (const row of rows) {
        const [id, firstName, lastName, dateOfBirth, jobDescription] = row.split(',');
        data.push({id, firstName, lastName, dateOfBirth, jobDescription});
    }
    return data;
}

// function to parse PTO CSV data
function parsePtoCSV(csvData) {
    const rows = csvData.trim().split(/\r?\n/);
    const data = [];
    for (const row of rows) {
        const [id, stardDate, endDate] = row.split(',');
        data.push({id, stardDate, endDate});
    }
    return data;
}