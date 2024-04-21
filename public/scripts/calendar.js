const currentDate = new Date(); // current date
currentDate.setHours(0, 0, 0, 0); // ignore hours, minutes, seconds and miliseconds
const currentYear = currentDate.getFullYear(); // current year
const currentMonth = currentDate.getMonth() + 1; // current month
const selectReference = new Date(currentDate); // a reference date for use by the createCalendar function
selectReference.setDate(1); // set the date to first of the month

// generate calendar interface for each element that has the "calendar" class
const calendars = document.querySelectorAll(".calendar");
calendars.forEach(c => {
    createCalendar(c, currentYear, currentMonth, currentDate, true);
});

/*
* function that generates a calendar
* @param selectedCalendar           calendar div in which to place the calendar
* @param year                       year that is to be displayed
* @param month                      month that is to be displayed
* @param firstRun                   if this is the first time you are creating a calendar for the given selectedCalendar set this to true, otherwise false, default false
*/
function createCalendar(selectedCalendar, year, month, firstRun = false) {
    const daysInMonth = new Date(year, month, 0).getDate(); // how many days does a month have
    const firstDay = new Date(year, month - 1, 1).getDay(); // day of the week
    const startIndex = firstDay - 1; // index from which to start filling the calendar

    selectedCalendar.innerHTML = ""; // clear previous content
    if(firstRun){ // if this is the first time a calendar is beeing rendered then set the data-selected-date attribute to current year and month
        selectedCalendar.dataset.selectedDate = selectReference.toISOString();
    }
    
    // create header for the calendar
    const header = document.createElement("div");
    header.classList.add("calendar-header");
    selectedCalendar.appendChild(header);

    // create left arrow
    const leftArrow = document.createElement("i");
    leftArrow.classList.add("bi", "bi-chevron-left");
    leftArrow.addEventListener("click", handleLeftArrow);

    // create right arrow
    const rightArrow = document.createElement("i");
    rightArrow.classList.add("bi", "bi-chevron-right");
    rightArrow.addEventListener("click", handleRightArrow);

    // create heading that will display current year and month
    const headerTitle = document.createElement("h2");
    const localeOptions = { // set appropriate locale options
        year: "numeric",
        month: "long",
      };
    const headerDate = new Date(year, month - 1); // insert the date into the heading
    headerTitle.textContent = headerDate.toLocaleString("en-US", localeOptions);

    // append title and arrows in the appropriate order
    header.appendChild(leftArrow);
    header.appendChild(headerTitle);
    header.appendChild(rightArrow);
    
    // create grid for days
    const calendarGrid = document.createElement("div");
    calendarGrid.classList.add("calendar-grid");
    selectedCalendar.appendChild(calendarGrid);
  
    // add labels for the days of the week
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
        const label = document.createElement("div");
        label.textContent = dayLabels[i];
        label.classList.add("day");
        calendarGrid.appendChild(label);
    }

    // fill in the calendar with days
    let day = 1;
    for (let i = 0; i < 6; i++) { // max 6 rows
        for (let j = 0; j < 7; j++) { // 7 columns for each day of the week
            const cell = document.createElement("div"); // create a div for each cell
            cell.classList.add("day"); // add a class "day" to each cell
            cell.addEventListener("click", handleSelect); // add a listener to each cell so that it can be selected
            if (i == 0 && j < startIndex) { // empty cells before the first day of the month
                cell.textContent = "";
            } else if (day > daysInMonth) { // empty cells after the last day of the month
                break;
            } else { // write a number in the cell
                cell.textContent = day++;
                if (day -1 == currentDate.getDate() && month == currentDate.getMonth() + 1 && year == currentDate.getFullYear()) { // search for the current date
                    cell.classList.add("current-day"); // add special styling to the current date
                }
            }
            calendarGrid.appendChild(cell); // append each cell into the calendar
        }
    }
}

/*
* handler for the left arrow of the calendar
* @param event      event that triggered the handle function
*/
function handleLeftArrow(event){
    const clickedArrow = event.currentTarget;
    const selectedCalendar = clickedArrow.closest(".calendar");

    // load the current year and month from the data-selected-date attribute
    let selectedDate = new Date(selectedCalendar.dataset.selectedDate);

    decreaseMonth(selectedDate); // decrease by one month

    selectedCalendar.dataset.selectedDate = selectedDate.toISOString(); // write new year and month to the data-selected-date attribute

    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth() + 1;

    // render new calendar with new year and month values
    createCalendar(selectedCalendar, selectedYear, selectedMonth);
}

/*
* handler for the right arrow of the calendar
* @param event      event that triggered the handle function
*/
function handleRightArrow(event){
    const clickedArrow = event.currentTarget;
    const selectedCalendar = clickedArrow.closest(".calendar");

    // load the current year and month from the data-selected-date attribute
    let selectedDate = new Date(selectedCalendar.dataset.selectedDate);

    increaseMonth(selectedDate); // increase by one month

    selectedCalendar.dataset.selectedDate = selectedDate.toISOString(); // write new year and month to the data-selected-date attribute

    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth() + 1;

    // render new calendar with new year and month values
    createCalendar(selectedCalendar, selectedYear, selectedMonth);
}

/*
* function that handles date selection
* when a date is clicked it colors it blue and forwards it to the hidden input field
* @param event      event that triggered the handle function
*/
function handleSelect(event){
    const clickedDay = event.currentTarget;
    
    if(clickedDay.textContent == ""){ // do not select an empty grid element
        return;
    }

    const currentCalendar = clickedDay.closest(".calendar");
    const allDays = currentCalendar.querySelectorAll(".day");

    // remove the previous selection
    allDays.forEach(day => {
        day.classList.remove("selected-day");
    });

    // add selection styling to the current selection
    clickedDay.classList.add("selected-day");

    // format date object that is to be forwarded to the form input
    const day = clickedDay.textContent;
    const selectedDate = new Date(currentCalendar.dataset.selectedDate); // load the current year and month from the data-selected-date attribute
    const dateToForward = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day); // compose a new date from the current year, month and day

    // forward the selected day to the hidden input
    const dateContainer = clickedDay.closest(".date-container");
    const dateInputField = dateContainer.querySelector(".date-input");
    dateInputField.value = dateToForward.toISOString();
}

/*
* decrease input date by one month
* @param date       date which needs to be decreased
*/
function decreaseMonth(date) {
    date.setMonth(date.getMonth() - 1);

    // If the new month is -1, adjust the year to the previous year and set the month to December
    if (date.getMonth() == -1) {
        date.setFullYear(date.getFullYear() - 1);
        date.setMonth(11); // December is represented as 11
    }
}

/*
* increase input date by one month
* @param date       date which needs to be increased
*/
function increaseMonth(date) {
    date.setMonth(date.getMonth() + 1);

    // if the new month is 12, set year to the next year and month to January
    if (date.getMonth() == 12) {
        date.setFullYear(date.getFullYear() + 1);
        date.setMonth(0); // January is represented as 0
    }
}

/*
* function to reset calendars to initial state
*/
export function resetCalendars(){
    const currentDate = new Date();
    const calendars = document.querySelectorAll(".calendar"); // query all calendars
    calendars.forEach(c => {
        c.dataset.selectedDate = currentDate.toISOString(); // reset date to current date

        // const allDays = c.querySelectorAll(".day");
        // allDays.forEach(day => { // remove styling for previously selected dates
        //     day.classList.remove("selected-day");
        // });

        const dateContainer = c.closest(".date-container");
        const dateInputField = dateContainer.querySelector(".date-input");
        dateInputField.value = ""; // delete previous date from the hidden input

        // render new calendar with new current year and month
        createCalendar(c, currentYear, currentMonth, true);
    });
}