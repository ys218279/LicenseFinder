import * as fs from 'fs';
import * as path from 'path';

const array: string[] = [
    '/Users/yousen01/Arm/ksc-ide/node_modules/@webpack-cli',
    '/Users/yousen01/Arm/ksc-ide/node_modules/@xtuc',
    '/Users/yousen01/Arm/ksc-ide/node_modules/JSONStream',
    '/Users/yousen01/Arm/ksc-ide/node_modules/abab',
    '/Users/yousen01/Arm/ksc-ide/node_modules/.bin'
];


function validating(filePaths: string[], callback: (processedFiles: string[]) => void) {
    console.log("validating");
    const processedFiles: string[] = [];
    let pendingReads = filePaths.length;

    filePaths.forEach((file) => {
        if (file.endsWith(".bin")) {
            console.log(".bin file found and excluded");
            pendingReads--
            if (pendingReads === 0) {
                console.log(processedFiles)
                callback(processedFiles);
            }
        }
        else {
            fs.stat(file, (error, stats) => {
                if (error) {
                    console.error(error);
                } else {
                    if (stats.isDirectory()) {
                        processedFiles.push(file);
                    }
                }

                pendingReads--
                if (pendingReads === 0) {
                    console.log(processedFiles)
                    callback(processedFiles);
                }
            });
        }
    });
}

function findFilePaths(processedFiles: string[], callback: (filePathList: string[]) => void) {
    console.log('collecting filePaths');
    const filePathList: string[] = [];
    const authors: string[] = [];
    let pendingReads = processedFiles.length;

    processedFiles.forEach((filePath) => {
        fs.readdir(filePath, (err: NodeJS.ErrnoException | null, files: string[]) => {
            if (err) {
                console.error(err);
                --pendingReads;
            }

            let pendingStats: number = files.length || 0;

            files.forEach((file) => {
                let fullPath = path.join(filePath, file);

                fs.stat(fullPath, (err, stats) => {
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
                            authors.forEach((filePathA) => {
                                fs.readdir(filePathA, (err: NodeJS.ErrnoException | null, nestedFilesA: string[]) => {
                                    if (err) {
                                        console.error(err);

                                    }
                                    nestedFilesA.forEach((nestedFile) => {
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

function findJSON(filePathList: string[], callback: (jsonFiles: string[]) => void) {
    console.log('finding JSON files');
    const jsonFiles: string[] = [];
    let pendingReads: number = filePathList.length;

    filePathList.forEach((filePath) => {
        if (filePath.endsWith('package.json')) {
            console.log(filePath);
            jsonFiles.push(filePath);
            pendingReads--;
            if (pendingReads === 0) {
                callback(jsonFiles);
            }
        }
        else {
            fs.stat(filePath, (err, stats) => {
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
                    fs.readdir(filePath, (err: NodeJS.ErrnoException | null, files: string[]) => {
                        if (err) {
                            console.error(err);
                            pendingReads--;
                            if (pendingReads === 0) {
                                callback(jsonFiles);
                            }
                            return;
                        }

                        let pendingNestedReads: number = files.length;
                        files.forEach((file) => {
                            const fullPath: string = path.join(filePath, file);
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
                } else {
                    pendingReads--;
                    if (pendingReads === 0) {
                        console.log(jsonFiles)
                        callback(jsonFiles);
                    }
                }
            });
        }
    });
}

function findLicense(files: string[], callback: (data: { [key: string]: string }) => void) {
    const data: { [key: string]: string } = {};
    let filesProcessed = 0;

    files.forEach(file => {
        fs.readFile(file, 'utf-8', (err, content) => {
            if (err) {
                console.error("Error reading file:", file, err);
                return;
            }

            const json = JSON.parse(content);
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


function writeToJSON(content: { [key: string]: string }, dir: string, fileName: string) {
    const filePath = path.join(dir, fileName);
    const objectContent = JSON.stringify(content);
    //console.log(objectContent)
    fs.writeFileSync(filePath, objectContent);
};

// Define a function to process the fetched data
function processData(data: string[]) {
    console.log("Data processed:", data);
}
/*
findFilePaths(array, (filePathList) => {
    findJSON(filePathList, (jsonFiles) => {
        processData(jsonFiles)
    });
});

*/

validating(array, (processedFiles) => {
    findFilePaths(processedFiles, (filePathList) => {
        findJSON(filePathList, (jsonFiles) => {
            findLicense(jsonFiles, (data) => {
                writeToJSON(data, '/Users/yousen01/Documents/Practice code/Federicco challenges/results', 'results.json')
            })
        });
    });
})