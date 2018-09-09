var app = require('electron').remote;
var dialog = app.dialog;

var fs = require('fs');

var imagefiles = [];
var currentimg = 0;

var saveDir;

document.getElementById('select-file').addEventListener('click', function () {
    // console.log(dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']}))
    dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] }, function (fileNames) {
        if (fileNames === undefined) {
            console.log("No file selected");
        } else {
            document.getElementById("actual-file").value = fileNames[0];
            readFile(fileNames[0]);
        }
    });
}, false);

document.getElementById('save-folder').addEventListener('click', function () {
    // console.log(dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']}))
    dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] }, function (fileNames) {
        if (fileNames === undefined) {
            console.log("No file selected");
        } else {
            // document.getElementById("actual-file").value = fileNames[0];
            saveDir = fileNames[0];
        }
    });
}, false);

document.getElementById('save-image').addEventListener('click', function () {
    if (saveDir == null) {
        alert("Please select a folder to save the files to first!");
        return;
    };
    if (imagefiles[currentimg] == null) {
        alert("You have to open an image before you can save it anywhere!");
        return;
    }
    fs.copyFile(imagefiles[currentimg], saveDir + "/" + imagefiles[currentimg].replace(/^.*[\\\/]/, ''), (err) => {// TODO: Figure out a way to seperate the path of the file from the name of the file so that the file can be saved with it's original name. 
        if (err) throw err;
        document.getElementById("save-image").value = "Saved!";
        setTimeout(() => {
            document.getElementById("save-image").value = "Save";
        }, 1000);
    });
}, false);


function readFile(filepath) {
    getFilesFromDir(filepath, function (err, content) {
        imagefiles = content;
    });

    currentimg = 0;
    changeImage(0);
}

function getExt(filename) {
    return filename.split('.').pop();
}

function isDir(filename) {
    var stats = fs.statSync(filename);
    return stats.isDirectory();
}

function getFilesFromDir(filepath, callback) {
    var result = null;
    fs.readdir(filepath, (err, dir) => {
        var filesindir = [];
        var morefiles = undefined;
        for (var i = 0, path; path = dir[i]; i++) { // Get all of the files in the directory. 
            if (!isDir(filepath + "/" + path)) {
                filesindir.push(filepath + "/" + path); // If they aren't a directory add them to the list. 
            }
            else { // If it is a directory add all of the files that are in that directory. 
                getFilesFromDir(filepath + "/" + path, function (err, content) {
                    for (var u = 0; u < content.length; u++) { // Add all of the files from that directory. 
                        filesindir.push(content[u]);
                    }
                });
            }
        }

        // Take out all of the files that are not image files. 
        var newfilesindir = [];
        for (var i = 0; i < filesindir.length; i++) {
            if (getExt(filesindir[i]).toLowerCase() == "png" || getExt(filesindir[i]).toLowerCase() == "jpg") {
                newfilesindir.push(filesindir[i]);
            }
        }

        filesindir = newfilesindir;

        result = filesindir;
        callback(null, result);
    });
}

document.getElementById("body").onkeydown = function (e) {
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == 39) {
        changeImage(1);
    }
    if (keyCode == 37) {
        changeImage(-1);
    }
}

function changeImage(dif) {
    currentimg += dif;

    if (imagefiles.length <= currentimg) {
        currentimg = 0;
    }
    if (currentimg < 0) {
        currentimg = imagefiles.length - 1;
    }

    setTimeout(() => {
        document.getElementById("img").src = imagefiles[currentimg];
    }, 100);
}

function deleteFile(filepath) {
    fs.exists(filepath, function (exists) {
        if (exists) {
            // File exists deletings
            fs.unlink(filepath, function (err) {
                if (err) {
                    alert("An error ocurred updating the file" + err.message);
                    console.log(err);
                    return;
                }
            });
        } else {
            alert("This file doesn't exist, cannot delete");
        }
    });
}

function saveChanges(filepath, content) {
    fs.writeFile(filepath, content, function (err) {
        if (err) {
            alert("An error ocurred updating the file" + err.message);
            console.log(err);
            return;
        }

        alert("The file has been succesfully saved");
    });
}