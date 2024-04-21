import { resetCalendars } from "./calendar.js";

// load employees information
const employees = await getEmployees();

const employeeSelect = document.getElementById("employee-id"); // currently selected employee in the dropdown menu
const employeePtoContainer = document.getElementById("employee-pto-container"); // container where employee cards will be placed
employees.forEach(e => {
    // add each employee to the dropdown menu
    const newOption = document.createElement("option");
    newOption.innerText =  e.firstName + " " + e.lastName;
    newOption.value = e.id;
    employeeSelect.appendChild(newOption);

    // create a card for each employee
    const newCard = document.createElement("div");
    newCard.classList.add("employee-card");
    newCard.setAttribute("data-id", e.id);
    newCard.innerHTML = `
        <label>${e.firstName} ${e.lastName}</label>
        <label>ID: ${e.id}</label>
        <hr/>
        <div class="pto-group past-pto">
            <label>Past PTO</label>
        </div>
        <div class="pto-group current-pto">
            <label>Current PTO</label>
        </div>
        <div class="pto-group upcoming-pto">
            <label>Upcoming PTO</label>
        </div>
    `;

    // append the new card to the container
    employeePtoContainer.appendChild(newCard);
});

// add a listener to the PTO insert form
const addPtoForm = document.getElementById("add-pto-form");
addPtoForm.addEventListener("submit", handleAddPto);

// load existing PTOs from local storage
loadExistingPtosFromDB()




/*
* function that loads PTOs from local storage and inserts them into DOM
*/
async function loadExistingPtosFromDB(){
  const ptosFromDB = await getPtoFromDB(); // get existing PTOs from local storage
	if(ptosFromDB){ // if there are any
        for(const dataBlock of ptosFromDB){
            const key = dataBlock.key;
            const pto = dataBlock.value;
            const startDate = new Date(pto.startDate); // start date of the PTO
            const endDate = new Date(pto.endDate); // end date of the PTO
            const newPtoElement = createPTOElement(pto.id, startDate, endDate, key); // create a new PTO element
            insertPTOElement(pto.id, newPtoElement, startDate, endDate); // insert the new element into the DOM
		};
	}
}

/*
* function that retreives the PTO data from local storage
* @return     returns PTO data from local storage
*/
function getPtoFromDB(){
	return new Promise((resolve, reject) => {
        const request = indexedDB.open('employee-db', 1);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;

            // Create an object store only if it doesn't exist
            if (!db.objectStoreNames.contains('pto')) {
                db.createObjectStore('employee', { autoIncrement: true });
                db.createObjectStore('pto', { autoIncrement: true });
            }
        };

        let data = new Array();

        request.onsuccess = function(event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('pto')) {
                resolve(data);
                return;
            }

            const transaction = db.transaction(['pto'], 'readonly');
            const objectStore = transaction.objectStore('pto');
            const cursorRequest = objectStore.openCursor();

            cursorRequest.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    let newDataBlock = new Object;
                    newDataBlock.key = cursor.key;
                    newDataBlock.value = cursor.value;
                    data.push(newDataBlock);
                    cursor.continue(); // Move to the next record
                } else {
                    // No more records
                    resolve(data);
                }
            };

            cursorRequest.onerror = function(event) {
                reject(event.target.error);
            };
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

/*
* function that handels adding of a PTO
*/
async function handleAddPto(event){
    // prevent the default form submission
    event.preventDefault();

    const formData = new FormData(event.target); // get the data from the form
    const id = formData.get("employee-id"); // employee id 
    const startDateInput = formData.get("start-date-input"); // inputed start date
    const endDateInput = formData.get("end-date-input"); // inputed end date

    if(!id){ // if the employee hasn't been selected an alert will be displayed
        alert("Please select an employee");
        return;
    }

    if(!startDateInput){ // if the start date hasn't been selected an alert will be displayed
        alert("Missing start date");
        return;
    }

    if(!endDateInput){ // if the end date hasn't been selected an alert will be displayed
        alert("Missing end date");
        return;
    }

    // create start and end date objects
    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);

    // compare start and end date
    if(startDate > endDate){
        alert("Start date must not be greater than end date");
        return;
    }

    // check whether the new PTO interval is in conflict with existing PTO intervals
    const confilct = await checkConflict(id, startDate, endDate);
    if(confilct){
        alert("There is a conflict between the new PTO and current PTOs");
        return;
        /* In case there is a conflict the input form (selection and calendars) will not be cleared.
            They are kept so that user can notice and correct the error.
            In case there was no conflict the form will be cleared. */
    }

    // data from the new PTO
    const newPTOData = {
        userId: id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    };

    const key = await insertIntoDB(newPTOData);

    // create a new PTO element
    const newPtoElement = createPTOElement(id, startDate, endDate, key);
    // insert the new PTO element into the DOM
    insertPTOElement(id, newPtoElement, startDate, endDate);

    resetCalendars(); // reset calendars to initial state

    // restore default form behaiour
    event.target.reset();
}

async function insertIntoDB(ptoData){
    let key = null;
    const request = indexedDB.open('employee-db', 1);
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        db.createObjectStore('employee', { autoIncrement: true });
        db.createObjectStore('pto', { autoIncrement: true });
    };
    await new Promise((resolve, reject) => {
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['pto'], 'readwrite');
            const objectStore = transaction.objectStore('pto');
        
            const addRequest = objectStore.add({ id: Number(ptoData.userId), startDate: ptoData.startDate, endDate: ptoData.endDate});
        
            addRequest.onsuccess = function(event) {
                key = event.target.result;
            };
            transaction.oncomplete = function() {
                resolve(key);
                console.log('Successfully added PTO to DB');
            };
            transaction.onerror = function(event) {
                reject(event.target.error); 
            }
        };
    });
    return key;
}

/*
* function to create a PTO element
* @param id         user ID
* @param startDate  start date for the PTO
* @param endDate    end date for the PTO
* @return           returns the newly created PTO element
*/
function createPTOElement(id, startDate, endDate, key){
    // set appropriate locale options
    const localeOptions = {
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    // create a new PTO element
    const newPto = document.createElement("div"); // create a div
    newPto.classList.add("pto-element"); // add "pto-element" class
    newPto.setAttribute("data-id", id); // set the "data-id" attribut containing employee's id
    newPto.setAttribute("data-startDate", startDate.toISOString()); // set the "data-start-date" attribute containing the start date of the PTO
    newPto.setAttribute("data-endDate", endDate.toISOString()); // set the "data-end-date" attribute containing the end date of the PTO
    newPto.setAttribute("data-key", key)

    // create the delete icon
    const xIcon = document.createElement("i");
    xIcon.classList.add("bi", "bi-x-circle", "x-icon");
    newPto.appendChild(xIcon);

    // create a label containing the PTO time interval
    const newPtoDatesLabel = document.createElement("label");
    if(startDate.getTime() != endDate.getTime()){ // if start and end date are different then dispay the range
        newPtoDatesLabel.innerText = `${startDate.toLocaleDateString("en-US", localeOptions)} - ${endDate.toLocaleDateString("en-US", localeOptions)}`
    } else{ // if the start and end date are the same then display that date only once
        newPtoDatesLabel.innerText = startDate.toLocaleDateString("en-US", localeOptions);
    }
    newPto.appendChild(newPtoDatesLabel);

    // set the background image for the appropriate season
    newPto.style.backgroundImage = getSeason(startDate);

    // add an event listener to the delete icon
    xIcon.addEventListener("click", removePTOElement);

    return newPto;
}

/*
* function that inserts a PTO element
* @param id         user ID
* @param newPto     PTO created by the createPTOElement function
* @param startDate  start date for the PTO
* @param endDate    end date for the PTO
*/
function insertPTOElement(id, newPto, startDate, endDate){
  const cards = document.querySelectorAll(".employee-card");
  const currentDate = new Date();

  // search for the card that holds the employee with the provided ID
  for (let index = 0; index < cards.length; index++) {
    const c = cards[index];
    if(c.getAttribute("data-id") == id){ // when the employee is found insert the PTO into the appropriate group
      if(endDate < currentDate){ // past PTO
        const pastPto = c.querySelector(".past-pto");
        pastPto.style.display = "block"; // reveal this category
        pastPto.appendChild(newPto);
      } else if(startDate < currentDate && endDate > currentDate){ // current PTO
        const currentPto = c.querySelector(".current-pto");
        currentPto.style.display = "block"; // reveal this category
        currentPto.appendChild(newPto);
      } else{ // upcoming PTO
        const upcomingPto = c.querySelector(".upcoming-pto");
        upcomingPto.style.display = "block"; // reveal this category
        upcomingPto.appendChild(newPto);
      }
      break;
    }
  }
}

/*
* function that calculates the season for a given date
* @param date   inut date
* @return       url for the background image of the appropriate season
*/
function getSeason(date){
    const month = date.getMonth() + 1; // calculate month

    // images for each season
    const springImg = "url(../images/spring.jpg)";
    const summerImg = "url(../images/summer.jpg)";
    const autumnImg = "url(../images/autumn.jpg)";
    const winterImg = "url(../images/winter.jpg)";

    // calculate which season the month corresponds to
    if(month >= 3 && month < 6){ // spring
        return springImg;
    } else if(month >=6 && month < 9){ // summer
        return summerImg;
    } else if(month >=9 && month < 12){ // autumn
        return autumnImg;
    } else{ // winter
        return winterImg;
    }
}

/*
* function that fetches information about employees
* return                  returns employee data
*/
async function getEmployees() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('employee-db', 1);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            db.createObjectStore('employee', { autoIncrement: true });
            db.createObjectStore('pto', { autoIncrement: true });
        };

        let data = new Array();

        request.onsuccess = function(event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('employee')) {
                resolve(data);
                return;
            }

            const transaction = db.transaction(['employee'], 'readonly');
            const objectStore = transaction.objectStore('employee');
            const cursorRequest = objectStore.openCursor();

            cursorRequest.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    data.push(cursor.value);
                    cursor.continue(); // move to the next record
                } else {
                    // no more records
                    resolve(data);
                }
            };

            cursorRequest.onerror = function(event) {
                reject(event.target.error);
            };
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}


/*
* function to remove a PTO
* @param e      event that triggered this handle function
*/
function removePTOElement(e) {
    const clickedX = e.currentTarget;
    const selectedPto = clickedX.parentElement;
    const key = Number(selectedPto.dataset.key);

    // display confirmation window
    const userConfirmation = confirm(`Are you sure you want to delete this PTO?`);

    // if the user cancels, abort the removal
    if (!userConfirmation) {
        return;
    }

    selectedPto.remove();

    // Open a database connection
    const request = indexedDB.open('employee-db', 1);

    request.onerror = function(event) {
        console.error(`Database error: ${event.target.errorCode}`);
    };

    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['pto'], 'readwrite');
        const objectStore = transaction.objectStore('pto');
        const requestDelete = objectStore.delete(key);
        
        requestDelete.onsuccess = function(event) {
            console.log("Sucessfully deleted PTO");

            // check whether there are any empty PTO categories
            const ptoContainer = document.querySelectorAll(".pto-group");
            ptoContainer.forEach(element => {
                if(element.children.length == 1){ // if a category has only one child (the label) and no other children (PTOs), then do not display it
                    element.style.display = "none";
                }
            });
        };
        
        requestDelete.onerror = function(event) {
            console.log("Error deleting PTO");
        };
    };

}

/*
* function that check whether there is a conflict between new PTO interval and current PTO intervals
* @param id                 ID of the user
* @param newStartDate       start date of the new PTO
* @param newEndDate         end date of the new PTO
* @return                   returns true if there is a conflict, otherwise false
*/
async function checkConflict(id, newStartDate, newEndDate) {
    const ptosFromDB = await getPtoFromDB(); // get existing PTOs from local storage
	if(ptosFromDB){ // if there are any PTOs in the DB
        const PTOsForEmployee = ptosFromDB.filter(pto => pto.value.id == id);
        for (let index = 0; index < PTOsForEmployee.length; index++) {
            const pto = PTOsForEmployee[index];
            const ptoStartDate = new Date(pto.value.startDate);
            const ptoEndDate = new Date(pto.value.endDate);
            if ((newStartDate < ptoEndDate && newEndDate > ptoStartDate) ||
                (newStartDate >= ptoStartDate && newEndDate <= ptoEndDate) ||
                (newStartDate <= ptoStartDate && newEndDate >= ptoEndDate)) {
                    return true; // there is a conflict
                }
            }
            return false; // there is no conflict
	} else{
        return false; // the DB is empty se there is no conflict
    }
}