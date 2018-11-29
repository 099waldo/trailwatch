var app = require('electron').remote;
var dialog = app.dialog;

var fs = require('fs');
var fspath = require('path');

var imagefiles = [];
var currentimg = 0;

var saveDir = "";

var minimap = document.getElementById("minimap");
var minimapEl;

var allowSlowLoading = false;

var imgsclicked = 0;

var agreed = false;

const { ipcRenderer } = require('electron');

var zoomable = false;
var zoomfigure = document.getElementById("zoomfigure");
var zoombutton = document.getElementById("zoom-button");

if (fs.existsSync("agreeToLicense")) {
    // Do something
    console.log("it exists");
    agreed = true;
}
else {
    console.log("It doens't exist");
    // Open licence agreement window.

    ipcRenderer.send('openLicenseWindow', "hi world");
}

function checkAgreed() {
    if (fs.existsSync("agreeToLicense")) {
        agreed = true;
    }
}

// Button onClick functions. 

// Select SD Card Button
document.getElementById('select-file').addEventListener('click', function () {
    if (agreed) {
        dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] }, function (fileNames) {
            if (fileNames === undefined) {
                console.log("No file selected");
            } else {
                document.getElementById("actual-file").value = fileNames[0];
                allowSlowLoading = false;
                minimapEl = null;
                readFile(fileNames[0]);
                document.getElementById("delete-button").hidden = false;
            }
        });
    }
    else {
        // Open license agreement window.
        ipcRenderer.send('openLicenseWindow', "hi world");
    }
}, false);

// Save folder button
document.getElementById('save-folder').addEventListener('click', function () {
    if (agreed) {
        dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] }, function (fileNames) {
            if (fileNames === undefined) {
                console.log("No file selected");
            } else {
                saveDir = fileNames[0];
            }
        });
    }
    else {
        // Open license agreement window.
        ipcRenderer.send('openLicenseWindow', "hi world");
    }
}, false);

// Save Image Button
document.getElementById('save-image').addEventListener('click', function () {
    if (agreed) {
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
    }
    else {
        // Open license agreement window.
        ipcRenderer.send('openLicenseWindow', "hi world");
    }
}, false);

// Delete All Images Button
document.getElementById('delete-button').addEventListener('click', function () {
    if (agreed) {
        var t = confirm("Are you sure you want to delete the pictures from the SD card?");
        if (t) {
            deleteImages();
        }
    }
    else {
        // Open license agreement window.
        ipcRenderer.send('openLicenseWindow', "hi world");
    }
}, false);

// Zoom Button
document.getElementById('zoom-button').addEventListener('click', function () {
    if (zoomable) {
        zoombutton.src = "notzoom.png";
        zoomable = !zoomable;
    }
    else {
        zoombutton.src = "zoom.png";
        zoomable = !zoomable;
    }
}, false);

// If pictures have already been imported, run the slowLoading function for the minimap images. 

setInterval(function () {
    if (allowSlowLoading) {
        slowLoading();
    }
    checkAgreed();
    if (imgsclicked > 20) {
        imgsclicked = 0;
        if (document.getElementById("tipbar") == null) {
            document.getElementById("slide-up").id = "slide-down";
        }
        else {
            document.getElementById("tipbar").id = "slide-down";
        }
        setTimeout(() => {
            document.getElementById("slide-down").id = "slide-up";
        }, 30000);
    }
}, 100);

// Refresh the minimap display when the window is resized. Fixes minimap display issues. 

window.onresize = function (event) {
    var n = document.createTextNode(' ');
    var disp = minimap.style.display;  // don't worry about previous display style

    minimap.appendChild(n);
    minimap.style.display = 'none';

    setTimeout(function () {
        minimap.style.display = disp;
        n.parentNode.removeChild(n);
    }, 20); // you can play with this timeout to make it as short as possible
};

// Imports all of the image files in the selected directory and subdirectories then displays the minimap.

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
        organizeImages();
    }, 50);
}

function deleteImages() {
    for (var i = 0; i < imagefiles.length; i++) {
        // Assuming that the path is a regular file.
        fs.unlink(imagefiles[i].path, (err) => {
            if (err) throw err;
            console.log('image was deleted');
        });
    }
    imagefiles = null;
    currentimg = 0;
    allowSlowLoading = false;
    minimap.innerHTML = null;
    document.getElementById("img").src = "placeholder.png";
    document.getElementById("delete-button").hidden = true;
    document.getElementById("actual-file").value = "Please select a file";
    alert("All of the images have been successfully deleted!");
}

// If the minimap doesn't have images on it yet, put images in it. 

function updateMiniMap() { // Will do nothing if there is no images already in the minimap.
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
            img.src = "placeholder.png";
            //img.src = imagefiles[i].path;
            img.setAttribute("data-src", imagefiles[i].path); // Use this instead to that we can only load the images when they are visable on the page. 
            img.draggable = false;
            button.appendChild(img);
            minimap.appendChild(button);
        }
    }
}

// Makes it so images in the minimap don't load all at once. Could be extended to unload images that aren't being displayed if there are issues with the program being slow. 

function slowLoading() { // This is probably running before it should. Thats why we're getting the undefined error. 
    if (minimapEl == null) {
        var minimapimgs = [];
        for (let i = 0; i < imagefiles.length; i++) {
            minimapimgs.push(document.getElementById(imagefiles[i].id));
        }
        minimapEl = minimapimgs;
    }
    for (var i = 0; i < minimapEl.length; i++) {
        if (isInViewport(minimapEl[i])) minimapEl[i].children[0].src = minimapEl[i].children[0].getAttribute("data-src");
    }
}

// Make the selected image in the minimap look like it is selected. 

function makeactive(theimg) {
    var img = document.getElementById(imagefiles[theimg].id);
    currentimg = theimg;

    resetMinimap();

    imgsclicked += 1;

    document.getElementById("img").src = imagefiles[theimg].path;
    centerMiniMap();
    updateZooming();
}

// Get the extension of the file. 

function getExt(filename) {
    return filename.split('.').pop();
}

// Returns true if the file is a directory. 

function isDir(filename) {
    var stats = fs.statSync(filename);
    return stats.isDirectory();
}

// Returns all of the image files in the selected directory and subdirectories. 

function getFilesFromDir(filepath, callback) {
    var result = null;
    var walk = function (dir, done) { // TODO: Change this function name to something else.
        var results = [];
        fs.readdir(dir, function (err, list) {
            if (err) return done(err);
            var pending = list.length;
            if (!pending) return done(null, results);
            list.forEach(function (file) {
                file = fspath.resolve(dir, file);
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        walk(file, function (err, res) {
                            results = results.concat(res);
                            if (!--pending) done(null, results);
                        });
                    } else {
                        results.push(file);
                        if (!--pending) done(null, results);
                    }
                });
            });
        });
    };
    walk(filepath, function (err, results) {
        if (err) throw err;
        console.log(results);
        var filesindir = [];
        var morefiles = undefined;
        for (var i = 0, path; path = results[i]; i++) { // Get all of the files in the directory.
            // console.log(path);
            // var fullpath = fspath.join(path, fileName[i]);
            // console.log(fullpath);
            if (!isDir(path)) {
                filesindir.push(path); // If they aren't a directory add them to the list. 
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
    })
}

// Makes the arrow keys scroll through the images. 

document.getElementById("body").onkeydown = function (e) {
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == 39 && imagefiles[0] != null) {
        changeImage(1);
    }
    if (keyCode == 37 && imagefiles[0] != null) {
        changeImage(-1);
    }
}

// Changes the current image by the difference from the current image. Make dif = 0 if you don't want to change the current image. 

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
    updateZooming();
}

// Center the selected image in the minimap. 

function centerMiniMap() {
    minimap.scrollLeft = (document.getElementById(imagefiles[currentimg].id).offsetLeft - minimap.offsetWidth / 2) + document.getElementById(imagefiles[currentimg].id).offsetWidth / 2;
}

// Reset the selected image in the minimap. 

function resetMinimap() {
    for (var i = 0; i < imagefiles.length; i++) {
        imagefiles[i].selected = false;
        document.getElementById(imagefiles[i].id).className = "image";
    }
    if (imagefiles != null) {
        imagefiles[currentimg].selected = true;
        document.getElementById(imagefiles[currentimg].id).className = "theimage";
    }
}

// Check if the DOM element is in the viewport. 

function isInViewport(el) {
    var rect = el.getBoundingClientRect();

    return (rect.right <= document.documentElement.clientWidth) && (rect.right > 0);
}

// Get the date of a image file.

async function getDate(path, thei) {
    let promise = new Promise((resolve, reject) => fs.stat(path, function (err, stats) {
        var mtime = new Date(stats.mtime);
        return resolve({ d: mtime, i: thei });
    }));

    let result = await promise;
    return result;
}

async function organizeImages() {
    for (var i = 0; i < imagefiles.length; i++) {
        var m = getDate(imagefiles[i].path, i);
        m.then(value => {
            // for (var i = 0; i < imagefiles.length; i++) {
            //     if (imagefiles[i].d == undefined) {
            //         imagefiles[i].d = value
            //         break;
            //     }
            // }
            imagefiles[value.i].d = value.d
        });
    }

    setTimeout(() => {
        // Sort imagefiles. 
        imagefiles.sort(function (a, b) { return new Date(a.d) - new Date(b.d); });

        // Reset ids
        for (var i = 0; i < imagefiles.length; i++) {
            imagefiles[i].id = "img" + i;
        }

        // Display minimap. 
        currentimg = 0;
        minimap.innerHTML = null;
        updateMiniMap();
        resetMinimap();
        changeImage(0);
        allowSlowLoading = true;
        setTimeout(() => {
            slowLoading();
        }, 500);
    }, 100);


}

function zoom(e) { // Check if zooming is enabled. 
    var zoomer = e.currentTarget;
    if (!zoomable) {
        zoomfigure.style.backgroundImage = "url('placeholder.png')";
        return;
    }
    updateZooming();
    e.offsetX ? offsetX = e.offsetX : offsetX = e.touches[0].pageX
    e.offsetY ? offsetY = e.offsetY : offsetX = e.touches[0].pageX
    x = offsetX / zoomer.offsetWidth * 100
    y = offsetY / zoomer.offsetHeight * 100
    zoomer.style.backgroundPosition = x + '% ' + y + '%';
}

function updateZooming() {
    const imgpath = imagefiles[currentimg].path.replace(/\\/g, '/');
    zoomfigure.style.backgroundImage = "url('" + imgpath + "')";
}

function hideimg(yesorno) {
    if (zoomable && yesorno) {
        document.getElementById("img").style.opacity = 0;
    }
    else {
        document.getElementById("img").style.opacity = 1;
    }
}