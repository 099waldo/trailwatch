document.getElementById('save-changes').addEventListener('click', function () {
    var actualFilePath = document.getElementById("actual-file").value;

    if (actualFilePath) {
        saveChanges(actualFilePath, document.getElementById('content-editor').value);
    } else {
        alert("Please select a file first");
    }
}, false);



document.getElementById('delete-file').addEventListener('click', function () {
    var actualFilePath = document.getElementById("actual-file").value;

    if (actualFilePath) {
        deleteFile(actualFilePath);
        document.getElementById("actual-file").value = "";
        document.getElementById("content-editor").value = "";
    } else {
        alert("Please select a file first");
    }
}, false);



document.getElementById('create-new-file').addEventListener('click', function () {
    var content = document.getElementById("content-editor").value;

    dialog.showSaveDialog(function (fileName) {
        if (fileName === undefined) {
            console.log("You didn't save the file");
            return;
        }

        fs.writeFile(fileName, content, function (err) {
            if (err) {
                alert("An error ocurred creating the file " + err.message)
            }

            alert("The file has been succesfully saved");
        });
    });
}, false);