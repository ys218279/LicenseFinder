"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var array = [
    '/Users/yousen01/Arm/ksc-ide/node_modules/@webpack-cli',
    '/Users/yousen01/Arm/ksc-ide/node_modules/@xtuc',
    '/Users/yousen01/Arm/ksc-ide/node_modules/JSONStream',
    '/Users/yousen01/Arm/ksc-ide/node_modules/abab',
    '/Users/yousen01/Arm/ksc-ide/node_modules/.bin'
];
function validating(filePaths, callback) {
    console.log("validating");
    var processedFiles = [];
    var pendingReads = filePaths.length;
    filePaths.forEach(function (file) {
        if (file.endsWith(".bin")) {
            console.log(".bin file found and excluded");
            pendingReads--;
            if (pendingReads === 0) {
                console.log(processedFiles);
                callback(processedFiles);
            }
        }
        else {
            fs.stat(file, function (error, stats) {
                if (error) {
                    console.error(error);
                }
                else {
                    if (stats.isDirectory()) {
                        processedFiles.push(file);
                    }
                }
                pendingReads--;
                if (pendingReads === 0) {
                    console.log(processedFiles);
                    callback(processedFiles);
                }
            });
        }
    });
}
function findFilePaths(processedFiles, callback) {
    console.log('collecting filePaths');
    var filePathList = [];
    var authors = [];
    var pendingReads = processedFiles.length;
    processedFiles.forEach(function (filePath) {
        fs.readdir(filePath, function (err, files) {
            if (err) {
                console.error(err);
                --pendingReads;
            }
            var pendingStats = files.length || 0;
            files.forEach(function (file) {
                var fullPath = path.join(filePath, file);
                fs.stat(fullPath, function (err, stats) {
                    if (err) {
                        console.error(err);
                        return; // Return early if there's an error
                    }
                    if (stats.isDirectory()) {
                        authors.push(fullPath);
                    }
                    filePathList.push(fullPath);
                    pendingStats--;
                    if (pendingStats === 0) {
                        // Check if there are authors to traverse
                        if (authors.length > 0) {
                            authors.forEach(function (filePathA) {
                                fs.readdir(filePathA, function (err, nestedFilesA) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    nestedFilesA.forEach(function (nestedFile) {
                                        filePathList.push(path.join(filePathA, nestedFile));
                                    });
                                });
                            });
                        }
                        pendingReads--;
                        if (pendingReads === 0) {
                            //console.log('found all filePaths');
                            //console.log(filePathList);
                            callback(filePathList);
                        }
                    }
                });
            });
        });
    });
}
function findJSON(filePathList, callback) {
    console.log('finding JSON files');
    var jsonFiles = [];
    var pendingReads = filePathList.length;
    filePathList.forEach(function (filePath) {
        if (filePath.endsWith('package.json')) {
            console.log(filePath);
            jsonFiles.push(filePath);
            pendingReads--;
            if (pendingReads === 0) {
                callback(jsonFiles);
            }
        }
        else {
            fs.stat(filePath, function (err, stats) {
                //console.log("stats")
                if (err) {
                    console.error(err);
                    pendingReads--;
                    if (pendingReads === 0) {
                        callback(jsonFiles);
                    }
                    return;
                }
                if (stats.isDirectory()) {
                    fs.readdir(filePath, function (err, files) {
                        if (err) {
                            console.error(err);
                            pendingReads--;
                            if (pendingReads === 0) {
                                callback(jsonFiles);
                            }
                            return;
                        }
                        var pendingNestedReads = files.length;
                        files.forEach(function (file) {
                            var fullPath = path.join(filePath, file);
                            if (fullPath.endsWith('package.json')) {
                                jsonFiles.push(fullPath);
                            }
                            pendingNestedReads--;
                            if (pendingNestedReads === 0) {
                                pendingReads--;
                                if (pendingReads === 0) {
                                    callback(jsonFiles);
                                }
                            }
                        });
                    });
                }
                else {
                    pendingReads--;
                    if (pendingReads === 0) {
                        console.log(jsonFiles);
                        callback(jsonFiles);
                    }
                }
            });
        }
    });
}
function findLicense(files, callback) {
    var data = {};
    var filesProcessed = 0;
    files.forEach(function (file) {
        fs.readFile(file, 'utf-8', function (err, content) {
            if (err) {
                console.error("Error reading file:", file, err);
                return;
            }
            var json = JSON.parse(content);
            if (json && json.license) {
                data[file] = json.license;
            }
            filesProcessed++;
            // If all files have been processed, invoke the callback
            if (filesProcessed === files.length) {
                //console.log("All files processed:", data);
                callback(data);
            }
        });
    });
}
function writeToJSON(content, dir, fileName) {
    var filePath = path.join(dir, fileName);
    var objectContent = JSON.stringify(content);
    //console.log(objectContent)
    fs.writeFileSync(filePath, objectContent);
}
;
// Define a function to process the fetched data
function processData(data) {
    console.log("Data processed:", data);
}
/*
findFilePaths(array, (filePathList) => {
    findJSON(filePathList, (jsonFiles) => {
        processData(jsonFiles)
    });
});

*/
validating(array, function (processedFiles) {
    findFilePaths(processedFiles, function (filePathList) {
        findJSON(filePathList, function (jsonFiles) {
            findLicense(jsonFiles, function (data) {
                writeToJSON(data, '/Users/yousen01/Documents/Practice code/Federicco challenges/results', 'results.json');
            });
        });
    });
});
