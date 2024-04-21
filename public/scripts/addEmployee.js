const addEmployeeForm = document.getElementById("add-employee");
addEmployeeForm.addEventListener("submit", (event) => {
    // prevent the default form submission
    event.preventDefault();

    const formData = new FormData(addEmployeeForm);
    const firstName = formData.get("first-name");
    const lastName = formData.get("last-name");
    const dateOfBirth = formData.get("date-of-birth");
    const jobDescription = formData.get("job-description");

    if(!(firstName && lastName && dateOfBirth && jobDescription)){
        setStatus("empty");
        return;
    }

    const request = indexedDB.open('employee-db', 1);

    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        db.createObjectStore('employee', { autoIncrement: true });
        db.createObjectStore('pto', { autoIncrement: true });
    };
    request.onerror = (event) => {
        console.error(`Database error: ${event.target.errorCode}`);
        setStatus("error");
    };
    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['employee'], 'readwrite');
        const objectStore = transaction.objectStore('employee');
        objectStore.add({id: getNextID(), firstName: firstName, lastName: lastName, dateOfBirth: dateOfBirth, jobDescription: jobDescription });

        transaction.oncomplete = function() {
            console.log('Transaction completed.');
        };
        location.reload();
    
        setStatus("success");
    
        addEmployeeForm.reset();
    };
});

function setStatus(statusCode){
    const statusMessage = document.getElementById("status");
    statusMessage.classList.remove("hidden");

    switch(statusCode){
        case "success":
            statusMessage.classList.add("bg-green-400");
            statusMessage.innerText = "Success";
            break;
        case "empty":
            statusMessage.classList.add("bg-red-400");
            statusMessage.innerText = "All fields are required";
            break;
        case "error":
        default:
            statusMessage.classList.add("bg-red-400");
            statusMessage.innerText = "Error";
    }
    // wait for 2 seconds
    setTimeout(function() {
        statusMessage.classList.add("hidden");
    }, 2000);
}

function getNextID(){
    let lastID = Number(localStorage.getItem("last_id"));
    if(!lastID) lastID = 0;
    const newID = lastID + 1;
    localStorage.setItem("last_id", newID);
    return newID;
}