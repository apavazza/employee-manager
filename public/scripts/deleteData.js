const deleteDataButton = document.getElementById("delete-data");
deleteDataButton.addEventListener("click", function(){
    const userConfirmation = confirm("Proceeding will delete all data in the application");
    if(!userConfirmation) return;

    const request = indexedDB.deleteDatabase('employee-db');

    request.onsuccess = function(event) {
        localStorage.removeItem("last_id");
        console.log('Database deleted successfully.');
    };

    request.onerror = function(event) {
        console.error('Error deleting database:', event.target.error);
    };

})