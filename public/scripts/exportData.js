const exportEmployeeDataButton = document.getElementById("export-employee-data");
exportEmployeeDataButton.addEventListener("click", () => exportData("employee")); 

const exportPTODataButton = document.getElementById("export-pto-data");
exportPTODataButton.addEventListener("click", () => exportData("pto"));

function exportData(selectedObjectStore){
    const request = indexedDB.open('employee-db', 1);
    let csvContent = "data:text/csv;charset=utf-8,";

    request.onsuccess = function(event) {
        const db = event.target.result;
        
        const transaction = db.transaction([selectedObjectStore], 'readonly');
        const objectStore = transaction.objectStore(selectedObjectStore);
        const cursorRequest = objectStore.openCursor();

        cursorRequest.onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                // cursor is pointing to a record
                const record = cursor.value;
                const csvRow = `${Object.values(record).join(',')}`;
                csvContent += csvRow + '\r\n';
                cursor.continue(); // move to the next record
            } else {
                // no more records
                alert('Data exported successfully');
                console.log('All entries retrieved');
                downloadCSV(csvContent, selectedObjectStore);
            }
        };

        cursorRequest.onerror = function(event) {
            console.error('Error retrieving entries:', event.target.error);
        };
    };
}

function downloadCSV(csvContent, filename) {
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
}
