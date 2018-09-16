var app = require('electron').remote;
var dialog = app.dialog;

var fs = require('fs');

var imagefiles = [];
var currentimg = 0;

var saveDir = "";

var minimap = document.getElementById("minimap");
var minimapEl;

var allowSlowLoading = false;

document.getElementById('select-file').addEventListener('click', function () {
    // console.log(dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']}))
    dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] }, function (fileNames) {
        if (fileNames === undefined) {
            console.log("No file selected");
        } else {
            document.getElementById("actual-file").value = fileNames[0];
            allowSlowLoading = false;
            minimapEl = null;
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
    if (saveDir == "") {
        alert("Please select a folder to save the files to first!");
        return;
    };
    if (imagefiles[currentimg] == null) {
        alert("You have to open an image before you can save it anywhere!");
        return;
    }
    fs.copyFile(imagefiles[currentimg].path, saveDir + "/" + imagefiles[currentimg].path.replace(/^.*[\\\/]/, ''), (err) => {
        if (err) throw err;
        document.getElementById("save-image").value = "Saved!";
        setTimeout(() => {
            document.getElementById("save-image").value = "Save";
        }, 1000);
    });
}, false);

setInterval(function () {
    if (allowSlowLoading) slowLoading();
}, 100);

function readFile(filepath) {
    getFilesFromDir(filepath, function (err, content) {
        imagefiles = content;
    });
    var images = [];

    setTimeout(() => {
        for (var i = 0; i < imagefiles.length; i++) {
            var s = false;
            if (i == 0) s = true;
            images.push({ path: imagefiles[i], selected: s, id: "img" + i });
        }
        imagefiles = images;
        currentimg = 0;
        minimap.innerHTML = null;
        updateMiniMap();
        changeImage(0);
        allowSlowLoading = true;
        setTimeout(() => {
            slowLoading();
        }, 500);
    }, 50);
}

function updateMiniMap() {
    if (minimap.innerHTML != null) { // Only run when pictures are imported. 
        for (var i = 0; i < imagefiles.length; i++) {
            var button = document.createElement("button");
            if (imagefiles[i].selected) {
                button.className = "theimage";
            }
            else {
                button.className = "image";
            }
            button.id = imagefiles[i].id;
            button.onclick = function () {
                makeactive(parseInt(this.id.replace(/\D/g, '')));
            }
            var img = document.createElement("img");
            img.className = "minimapimg";
            img.src = "http://spacergif.org/spacer.gif";
            img.setAttribute("data-src", imagefiles[i].path);
            //img.src = imagefiles[i].path;
            img.draggable = false;
            button.appendChild(img);
            minimap.appendChild(button);
        }
    }
}

function slowLoading() {
    if (minimapEl == null) {
        var minimapimgs = [];
        for (let i = 0; i < imagefiles.length; i++) {
            minimapimgs.push(document.getElementById(imagefiles[i].id));
        }
        minimapEl = minimapimgs;
    }
    // console.log(minimapimgs);
    for (var i = 0; i < minimapEl.length; i++) {
        // console.log(i + " " + minimapimgs[i].dataset.src);
        if (isInViewport(minimapEl[i])) minimapEl[i].children[0].src = minimapEl[i].children[0].getAttribute("data-src");
    }
}

function makeactive(theimg) {
    var img = document.getElementById(imagefiles[theimg].id);
    currentimg = theimg;

    resetMinimap();

    // if (imagefiles[theimg].selected) {
    //     img.className = "image";
    //     imagefiles[theimg - 1].selected = false;
    // }
    // else {
    //     img.className = "theimage";
    //     imagefiles[theimg].selected = true;
    // }
    document.getElementById("img").src = imagefiles[theimg].path;
    centerMiniMap();
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

    resetMinimap();

    document.getElementById("img").src = imagefiles[currentimg].path;
    centerMiniMap();
}

function centerMiniMap() {
    minimap.scrollLeft = (document.getElementById(imagefiles[currentimg].id).offsetLeft - minimap.offsetWidth / 2) + document.getElementById(imagefiles[currentimg].id).offsetWidth / 2;
}

function resetMinimap() {
    for (var i = 0; i < imagefiles.length; i++) {
        imagefiles[i].selected = false;
        document.getElementById(imagefiles[i].id).className = "image";
    }
    imagefiles[currentimg].selected = true;
    document.getElementById(imagefiles[currentimg].id).className = "theimage";
}

function isInViewport(el) {
    var rect = el.getBoundingClientRect();

    return (rect.right <= document.documentElement.clientWidth) && (rect.right > 0);
}