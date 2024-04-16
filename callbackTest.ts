import * as fs from 'fs';
import * as path from 'path';

if (process.argv.length < 3) {
    console.error('Usage: ts-node script.ts <startingPath>');
    process.exit(1);
}

// Get the starting path from the command-line arguments
const startingPath = process.argv[2];

function goToNodeModules(startingPath: string, callback: (filePaths: string[]) => void) {
    console.log("start function")
    const filePaths: string[] = []
    const dir: string = path.join(startingPath, "node_modules");
    fs.readdir(dir, (err: NodeJS.ErrnoException | null, files: string[]) => {
        if (err) {
            console.error(err);
            return; // Exit early if there's an error
        }
        files.forEach((file) => {
            filePaths.push(path.join(dir, file));
        });
        console.log(filePaths); // Log the populated filePaths array
        callback(filePaths);
    });
}
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
    let pendingReads: number = processedFiles.length;

    processedFiles.forEach((filePath) => {
        fs.readdir(filePath, (err: NodeJS.ErrnoException | null, files: string[]) => {
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
            } else {
                let pendingNestedReads: number = files.length;

                files.forEach((file) => {
                    const nestedFilePath: string = path.join(filePath, file);
                    fs.readdir(nestedFilePath, (err: NodeJS.ErrnoException | null, nestedFiles: string[]) => {
                        if (err) {
                            console.error(err);
                            pendingNestedReads--;
                            if (pendingNestedReads === 0) {
                                pendingReads--;
                                if (pendingReads === 0) {
                                    callback(filePathList);
                                }
                            }

                        }

                        if (nestedFiles.includes('package.json')) {
                            filePathList.push(path.join(nestedFilePath, 'package.json'));
                        }

                        pendingNestedReads--;
                        if (pendingNestedReads === 0) {
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

function findLicense(files: string[], callback: (data: { [key: string]: string[] }) => void) {
    const data: { [key: string]: string[] } = {};
    let filesProcessed = 0;

    files.forEach(file => {
        fs.readFile(file, 'utf-8', (err, content) => {
            if (err) {
                console.error("Error reading file:", file, err);

            }

            const json = JSON.parse(content);
            if (json && json.license) {
                const license = json.license;
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


function writeToJSON(content: { [key: string]: string[] }, dir: string, fileName: string) {
    const filePath = path.join(dir, fileName);
    const objectContent = JSON.stringify(content);
    //console.log(objectContent)
    fs.writeFileSync(filePath, objectContent);
};

// Define a function to process the fetched data. Used for debugging
function processData(data: string[]) {
    console.log("Data processed:", data);
}

goToNodeModules(startingPath, (filePaths) => {
    validating(filePaths, (processFiles) => {
        findFilePaths(processFiles, (filePathsList) => {
            findLicense(filePathsList, (data) => {
                writeToJSON(data, '<destination path>', 'results.json')
            })
        })
    })
})
