const employeeContainer = document.getElementById("list-employees");

const request = indexedDB.open('employee-db', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('employee', { autoIncrement: true });
    db.createObjectStore('pto', { autoIncrement: true });
};

request.onsuccess = function(event) {
    const db = event.target.result;

    if (!db.objectStoreNames.contains('employee')) return;
    
    const transaction = db.transaction(['employee'], 'readonly');
    const objectStore = transaction.objectStore('employee');
    const cursorRequest = objectStore.openCursor();

    cursorRequest.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            // Cursor is pointing to a record
            createListElement(cursor.key, cursor.value);
            cursor.continue(); // Move to the next record
        } else {
            // No more records
            console.log('All entries retrieved');
        }
    };

    cursorRequest.onerror = function(event) {
        console.error('Error retrieving entries:', event.target.error);
    };
};

function createListElement(key, value){
    const employeeList = document.getElementById("list-employees");
    const newListELement = document.createElement("div");
    newListELement.classList.add("m-1", "p-1", "relative", "bg-gray-100", "rounded-md")
    newListELement.dataset.id = value.id;
    newListELement.dataset.key = key;
    
    const editIcon = document.createElement("i");
    editIcon.classList.add("bi", "bi-pencil-square", "m-1");
    editIcon.addEventListener("click", editEmployee);
    newListELement.appendChild(editIcon);
    
    const employeeData = document.createElement("form");
    employeeData.classList.add("inline");
    employeeData.innerHTML = `
        <p class="inline m-1">${value.id}</p>
        <p class="first-name inline m-1">${value.firstName}</p>
        <p class="last-name inline m-1">${value.lastName}</p>
        <p class="date-of-birth inline m-1">${value.dateOfBirth}</p>
        <p class="job-description inline m-1">${value.jobDescription}</p>`;
    newListELement.appendChild(employeeData);

    const deleteIcon = document.createElement("i");
    deleteIcon.classList.add("bi", "bi-x-circle", "absolute", "text-red-500", "hover:text-red-700");
    deleteIcon.style.top = "-10px";
    deleteIcon.style.right = "-7px";
    deleteIcon.addEventListener("click", deleteEmployee);
    newListELement.appendChild(deleteIcon);

    employeeList.appendChild(newListELement);
}

function editEmployee(e){
    const editIcon = e.currentTarget;
    const employeeContainer = editIcon.parentElement;

    editIcon.classList.add("hidden");

    const pFirstName = employeeContainer.getElementsByClassName("first-name")[0];
    let inputFirstName = document.createElement("input");
    inputFirstName.name = "first-name";
    inputFirstName.value = pFirstName.textContent;
    inputFirstName.classList.add("m-1", "p-1", "rounded-md", "bg-gray-300");
    pFirstName.replaceWith(inputFirstName);

    const pLastName = employeeContainer.getElementsByClassName("last-name")[0];
    let inputLastName = document.createElement("input");
    inputLastName.name = "last-name";
    inputLastName.value = pLastName.textContent;
    inputLastName.classList.add("m-1", "p-1", "rounded-md", "bg-gray-300");
    pLastName.replaceWith(inputLastName);

    const pDateOfBirth = employeeContainer.getElementsByClassName("date-of-birth")[0];
    let inputDateOfBirth = document.createElement("input");
    inputDateOfBirth.name = "date-of-birth";
    inputDateOfBirth.value = pDateOfBirth.textContent;
    inputDateOfBirth.classList.add("m-1", "p-1", "rounded-md", "bg-gray-300");
    pDateOfBirth.replaceWith(inputDateOfBirth);

    const pJobDescription = employeeContainer.getElementsByClassName("job-description")[0];
    let inputJobDescription = document.createElement("input");
    inputJobDescription.name = "job-description";
    inputJobDescription.value = pJobDescription.textContent;
    inputJobDescription.classList.add("m-1", "p-1", "rounded-md", "bg-gray-300");
    pJobDescription.replaceWith(inputJobDescription);
    
    const updateForm = employeeContainer.getElementsByTagName("form")[0];

    const saveButton = document.createElement("button");
    saveButton.innerText = "Save";
    saveButton.type = "submit";
    saveButton.classList.add("ml-3", "p-1", "rounded-md", "bg-gray-400", "hover:bg-gray-500", "active:bg-gray-600");
    updateForm.addEventListener("submit", handleEmployeeUpdate);
    updateForm.appendChild(saveButton);


    const cancelButton = document.createElement("button");
    cancelButton.innerText = "Cancel";
    cancelButton.type = "button";
    cancelButton.classList.add("ml-3", "p-1", "rounded-md", "bg-gray-400", "hover:bg-gray-500", "active:bg-gray-600");
    cancelButton.addEventListener("click", () => location.reload());
    updateForm.appendChild(cancelButton);
}

function handleEmployeeUpdate(e){
    const saveButton = e.target;
    const employeeContainer = saveButton.parentElement;
    const key = Number(employeeContainer.dataset.key);
    const formData = new FormData(e.target);

    e.preventDefault();

    const request = indexedDB.open('employee-db', 1);

    request.onerror = function(event) {
        console.error(`Database error: ${event.target.errorCode}`);
    };

    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['employee'], 'readwrite');
        const objectStore = transaction.objectStore('employee');
        const getRequest = objectStore.get(key);

        getRequest.onsuccess = function(event) {
            const record = event.target.result;
            record.firstName = formData.get("first-name");
            record.lastName = formData.get("last-name");
            record.dateOfBirth = formData.get("date-of-birth");
            record.jobDescription = formData.get("job-description");
    
            // put the modified record back into the object store
            const updateRequest = objectStore.put(record, key);
    
            updateRequest.onsuccess = function(event) {
                console.log('Record updated successfully');
            };
    
            updateRequest.onerror = function(event) {
                console.error('Error updating record');
            };
        };
    
        getRequest.onerror = function(event) {
            console.error('Error retrieving record');
        };
    };

    location.reload();
}

function deleteEmployee(e){
    const deleteIcon = e.currentTarget;
    const employeeContainer = deleteIcon.parentElement;
    const key = Number(employeeContainer.dataset.key);
    
    const confirmation = confirm("Confirm to delete employee");
    if(!confirmation) return;

    const request = indexedDB.open('employee-db', 1);

    request.onerror = function(event) {
        console.error(`Database error: ${event.target.errorCode}`);
    };

    request.onsuccess = function(event) {
        const db = event.target.result;
        
        const transaction = db.transaction(['employee'], 'readwrite');
        const objectStore = transaction.objectStore('employee');
        const requestDelete = objectStore.delete(key);
        
        requestDelete.onsuccess = function(event) {
            employeeContainer.remove();
            console.log("Sucessfully deleted employee");
        };
        
        requestDelete.onerror = function(event) {
            console.log("Error deleting employee");
        };
    };
}