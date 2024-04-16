"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
if (process.argv.length < 3) {
    console.error('Usage: ts-node script.ts <startingPath>');
    process.exit(1);
}
// Get the starting path from the command-line arguments
var startingPath = process.argv[2];
function goToNodeModules(startingPath, callback) {
    console.log("start function");
    var filePaths = [];
    var dir = path.join(startingPath, "node_modules");
    fs.readdir(dir, function (err, files) {
        if (err) {
            console.error(err);
            return; // Exit early if there's an error
        }
        files.forEach(function (file) {
            filePaths.push(path.join(dir, file));
        });
        console.log(filePaths); // Log the populated filePaths array
        callback(filePaths);
    });
}
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
    var pendingReads = processedFiles.length;
    processedFiles.forEach(function (filePath) {
        fs.readdir(filePath, function (err, files) {
            if (err) {
                console.error(err);
                pendingReads--;
                if (pendingReads === 0) {
                    callback(filePathList);
                }
            }
            if (files.includes("package.json")) {
                filePathList.push(path.join(filePath, 'package.json'));
                pendingReads--;
                if (pendingReads === 0) {
                    callback(filePathList);
                }
            }
            else {
                var pendingNestedReads_1 = files.length;
                files.forEach(function (file) {
                    var nestedFilePath = path.join(filePath, file);
                    fs.readdir(nestedFilePath, function (err, nestedFiles) {
                        if (err) {
                            console.error(err);
                            pendingNestedReads_1--;
                            if (pendingNestedReads_1 === 0) {
                                pendingReads--;
                                if (pendingReads === 0) {
                                    callback(filePathList);
                                }
                            }
                        }
                        if (nestedFiles.includes('package.json')) {
                            filePathList.push(path.join(nestedFilePath, 'package.json'));
                        }
                        pendingNestedReads_1--;
                        if (pendingNestedReads_1 === 0) {
                            pendingReads--;
                            if (pendingReads === 0) {
                                callback(filePathList);
                            }
                        }
                    });
                });
            }
        });
    });
}
function findLicense(files, callback) {
    var data = {};
    var filesProcessed = 0;
    files.forEach(function (file) {
        fs.readFile(file, 'utf-8', function (err, content) {
            if (err) {
                console.error("Error reading file:", file, err);
            }
            var json = JSON.parse(content);
            if (json && json.license) {
                var license = json.license;
                if (!data[license]) {
                    data[license] = [];
                }
                data[license].push(file);
            }
            filesProcessed++;
            // If all files have been processed, invoke the callback
            if (filesProcessed === files.length) {
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
// Define a function to process the fetched data. Used for debugging
function processData(data) {
    console.log("Data processed:", data);
}
goToNodeModules(startingPath, function (filePaths) {
    validating(filePaths, function (processFiles) {
        findFilePaths(processFiles, function (filePathsList) {
            findLicense(filePathsList, function (data) {
                writeToJSON(data, '<destination path>', 'results.json');
            });
        });
    });
});
