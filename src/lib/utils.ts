import { readFile, writeFile } from "fs/promises";
import MainService from "../services/main.service";
import DockerService from "../services/docker.service";
import dockerRunResult from "../interfaces/dockerRunResult";
const dockerService = new DockerService();
import Dockerode from "dockerode";
import { join, resolve } from "path";
const docker = new Dockerode();



interface SubmissionMessage {
    problemId: string;
    language: string;
    code: string;
    submissionId: string;
}


export default class Utils {


    // Build and run a Docker container for a given language
    public static async runLanguageContainer(language: string, memoryLimit: number = 128, cmd: string[] = []): Promise<void> {
        try {

            const { buildOutput } = await dockerService.buildDockerImage(language);
            console.log(buildOutput)


        } catch (error) {
            console.error("Error building or running container:", error);

        }
    }

    public static createParamsLine(codeParams: string[]) {
        let paramsLine = "";
        // add every parameter to the params line
        codeParams.forEach((param, index) => {
            paramsLine += `data["input"]["${param}"]`;
            if (index < codeParams.length - 1) {
                paramsLine += ", ";
            }
        });

        return paramsLine;
    }

    public static createCallLine(codeParams: string[], functionName: string) {
        let callLine = `${functionName}(`;

        const paramsLine = this.createParamsLine(codeParams);
        callLine += paramsLine;

        callLine += ");";
        return { callLine, paramsLine };
    }

    public static async injectCode(path: string, callLine: string, paramsLine: string, code: string, functionName: string) {
        let codeRunnerFile = await readFile(
            path,
            "utf8"
        );

        codeRunnerFile = codeRunnerFile.replace("$&{FINJECT}&$", code);
        codeRunnerFile = codeRunnerFile.replace("$&{FCALL}&$", callLine);
        codeRunnerFile = codeRunnerFile.replace("$&{FNAME}&$", functionName);
        codeRunnerFile = codeRunnerFile.replace("$&{FPARAMS}&$", paramsLine);

        await writeFile("./languageRunners/cpp/runInstance.cpp", codeRunnerFile);
    }

    public static async handleSubmissionMessage(message: SubmissionMessage) {
        // get problem info 
        const mainService = new MainService();
        const problem = await mainService.getProblem(message.problemId);

        // get test cases of problem 
        const testCases = await mainService.getTestCases(message.problemId);

        // create call line and use infro from problem  info 
        const { callLine, paramsLine } = this.createCallLine(problem.data.parametersNames, problem.data.functionName);



        // inject code into the code runner instance file
        await this.injectCode("./languageRunners/cpp/main.cpp", callLine, paramsLine, message.code, problem.data.functionName);
        // build and run container with constraints from test case ingfo and pass test case to it 

        console.log("Building and running container");
        const buildStartTime = performance.now();
        // const buildOutput = await dockerService.buildDockerImage(join(__dirname, `../../languageRunners/cpp`));
        // console.log("Build output", buildOutput);

        const { id } = await dockerService.createContainer("code-sandbox", {});
        console.log("Container created", id);
        const container = docker.getContainer(id);
        container.wait();
        const buildEndTime = performance.now();
        const totalTime = Math.abs(buildStartTime - buildEndTime);
        console.log("Total time to build and create container: ", totalTime.toFixed(2));

        // Assuming the container is already created and running

        const formattedTestCases = {
            testCases: testCases
        };
        console.log("Number of test cases", testCases.length);
        const JSONTestCases = JSON.stringify(formattedTestCases);


        const compileStartTime = performance.now();
        // Step 1: Compile the application
        const compileExec = await container.exec({
            Cmd: ['sh', '-c', 'g++ runInstance.cpp -o myapp'],
            AttachStderr: true,
            AttachStdout: true,
        });

        const compilationResult = await new Promise((resolve, reject) => {
            compileExec.start({ Tty: false, hijack: true }, (err, stream) => {
                if (err) {
                    console.error("Error starting compile exec:", err);
                    reject(err);
                }

                let compileOutput = '';

                stream?.on('data', (data) => {
                    compileOutput += data.toString();
                    console.log('Compile Output:', data.toString());
                });

                stream?.on('end', () => {
                    if (compileOutput.includes('error')) {
                        reject(new Error('Compilation error detected.'));
                    } else {
                        resolve("Done");
                    }
                });
            });
        }).catch(async (error) => {
            console.error("Compilation error:", error);
            await mainService.updateSubmissionStatus(message.submissionId, "CE");
            console.log("Submission status updated");
            return null;
        });

        if (compilationResult !== "Done") {
            return;
        }

        const compileEndTime = performance.now();
        const compileTime = compileEndTime - compileStartTime;
        console.log("Compile time", compileTime.toFixed(2));


        // Step 2: Run the application
        const runExec = await container.exec({
            Cmd: ['sh', '-c', `./myapp '${JSONTestCases}'`],
            AttachStderr: true,
            AttachStdout: true,
        });

        const startExec = performance.now();
        const result = await new Promise<{ result: string, failedTestCaseIndex?: string }>((resolve, reject) => {
            runExec.start({ Tty: false, hijack: true }, (err, stream) => {
                if (err) {
                    console.error("Error starting run exec:", err);
                    reject(err);
                }
                let stdout = '';

                stream?.on('data', (data) => {
                    stdout += data.toString();
                    console.log('Run Output:', data.toString());
                });

                stream?.on('end', () => {
                    const jsonOutput = this.extractJson(stdout);
                    if (!jsonOutput) {
                        reject(new Error('No valid JSON found in output.'));
                        return;
                    }
                    try {
                        const jsonData = JSON.parse(jsonOutput);
                        resolve(jsonData);
                    } catch (e) {
                        reject(new Error(`Failed to parse JSON: ${e}`));
                    }
                });
            });
        }).catch(async (error) => {
            console.error("Runtime error:", error);
            await mainService.updateSubmissionStatus(message.submissionId, "RTE");
            console.log("Submission status updated");
            return null;
        });

        if (!result) {
            return;
        }
        console.log("Result", result);
        const endExec = performance.now();
        const execTime = endExec - startExec;
        console.log("Exec time", execTime.toFixed(2));

        console.log("Total Time:", (compileTime + execTime).toFixed(2));


        await mainService.updateSubmissionStatus(message.submissionId, result.result);
        console.log("Submission status updated");

    };



    public static extractJson(stdout: string) {
        // Match the last JSON object in the output
        const match = stdout.match(/\{.*\}\s*$/s);
        return match ? match[0] : null;
    }




    public static deepEqual(obj1: { [key: string]: any }, obj2: { [key: string]: any }): boolean {
        // Check if both arguments are the same reference
        if (obj1 === obj2) return true;

        // Check if either argument is null or not an object
        if (obj1 == null || obj2 == null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
            return false;
        }

        // Check if both are arrays
        const isArray1 = Array.isArray(obj1);
        const isArray2 = Array.isArray(obj2);

        if (isArray1 && isArray2) {
            // Check array length
            if (obj1.length !== obj2.length) return false;

            // Recursively compare each element in the arrays
            for (let i = 0; i < obj1.length; i++) {
                if (!this.deepEqual(obj1[i], obj2[i])) {
                    return false;
                }
            }
            return true; // Arrays are equal
        } else if (isArray1 || isArray2) {
            return false; // One is an array and the other is not
        }

        // Get the keys of both objects
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        // Check if they have the same number of keys
        if (keys1.length !== keys2.length) return false;

        // Recursively compare each key and value
        for (let key of keys1) {
            if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
                return false;
            }
        }

        return true; // Objects are equal
    }



}