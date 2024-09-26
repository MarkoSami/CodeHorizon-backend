import { readFile, writeFile } from "fs/promises";
import MainService from "../services/main.service";
import DockerService from "../services/docker.service";
import dockerRunResult from "../interfaces/dockerRunResult";
const dockerService = new DockerService();
import Dockerode from "dockerode";
const docker = new Dockerode();




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

    public static createCallLine(codeParams: string[], functionName: string) {
        let callLine = `${functionName}(`;
        // add every parameter to the call line
        codeParams.forEach((param, index) => {
            callLine += `data["${param}"]`;
            if (index < codeParams.length - 1) {
                callLine += ", ";
            }
        });

        callLine += ");";
        return callLine;
    }

    public static async injectCode(path: string, callLine: string, code: string) {
        let codeRunnerFile = await readFile(
            path,
            "utf8"
        );

        codeRunnerFile = codeRunnerFile.replace("$&{FINJECT}&$", code);
        codeRunnerFile = codeRunnerFile.replace("$&{FCALL}&$", callLine);

        await writeFile("./languageRunners/cpp/runInstance.cpp", codeRunnerFile);
    }

    public static async handleSubmissionMessage(message: any) {
        // get problem info 
        const meinService = new MainService();
        const problem = await meinService.getProblem(message.problemId);

        // get test cases of problem 
        const testCases = await meinService.getTestCases(message.problemId);

        // create call line and use infro from problem  info 
        const callLine = this.createCallLine(problem.data.parametersNames, problem.data.functionName);

        // inject code into the code runner instance file
        await this.injectCode("./languageRunners/cpp/main.cpp", callLine, message.code);
        // build and run container with constraints from test case ingfo and pass test case to it 


        const buildOutput = await dockerService.buildDockerImage("cpp");
        console.log("Build output", buildOutput);

        const { id } = await dockerService.createContainer("language-runner-cpp");
        console.log("Container created", id);
        const container = docker.getContainer(id);
        container.wait();

        console.log("TestCase", JSON.stringify(`{"testCase": ${JSON.stringify(testCases[0].input)}}`));


        const startTesting = performance.now();

        for (const testCase of testCases) {
            const testCaseInput = { testCase: testCase["input"] };
            const parsedTestCase = JSON.stringify(testCaseInput);
            // console.log("Test case", parsedTestCase);
            // const containerInfo = await container.inspect();
            const exec = await container.exec({
                Cmd: ["./myapp", parsedTestCase],
                AttachStderr: true,
                AttachStdout: true,
            });

            await new Promise((resolve, reject) => {
                exec.start({ Tty: false, hijack: true }, (err, stream) => {
                    if (err) {
                        console.error("Error starting exec:", err);
                        reject(err);
                    }

                    stream?.on('data', (data) => {
                        console.log('Output:', data.toString());
                    });

                    stream?.on('error', (err) => {
                        console.error("Stream error:", err);
                    });

                    stream?.on('end', async () => {
                        resolve("Done");
                    });
                });
            });

        };

        const endtesting = performance.now();

        console.log('Stream ended');
        const startTime = performance.now();
        await container.stop({ t: 0 });
        await container.remove();
        const endTime = performance.now();
        const totalTIme = endTime - startTime;
        console.log("Total time To Stop and remove container: ", totalTIme.toFixed(2));

        const totalTestingTime = endtesting - startTesting;
        console.log(`Total time To test ${testCases.length} test cases: `, totalTestingTime.toFixed(2));


        // console.log("Container Status:", containerInfo);
        // console.log("Container info", containerInfo);

        // console.log("Container is running", container.id);
        // console.log(JSON.stringify(`{"testCase": ${JSON.stringify(testCases[0].input)}}`));
        // const exec = await container.exec({
        //     Cmd: ["./myapp", JSON.stringify(`{"testCase": ${JSON.stringify(testCases[0].input)}}`)],
        //     AttachStdout: true,
        //     AttachStderr: true,
        // });
        // console.log("Exec created", exec.id);
        // const stream = await exec.start({ Tty: true });

        // console.log("Exec started", exec.id);

        // let output = "";
        // stream.on("data", (data) => {
        //     output += data.toString();
        // });
        // stream.on("error", (error) => {
        //     console.log("Error", error);
        // });
        // stream.on("end", async () => {
        //     console.log("Output", output);
        //     // const result = JSON.parse(output);
        //     console.log("Result", output);
        //     await container.stop();
        //     console.log("Container stopped", container.id);
        //     await container.remove();
        //     console.log("Container removed", container.id);
        // });



        // for (let i = 0; i < testCases.length; i++) {
        //     const testCase = testCases[i];
        //     console.log("Running test case", JSON.stringify(testCase.input));
        //     const startTime = performance.now();

        //     const endTime = performance.now();
        //     const totalTIme = endTime - startTime;
        // const actualOutput = JSON.parse(result as string);
        // const expectedOutput = testCase.output;

        // console.log("Actual Output", actualOutput);
        // console.log("Expected Output", expectedOutput);

        // const wrongAnswer = !this.deepEqual(actualOutput, expectedOutput);
        // console.log("Wrong Answer", wrongAnswer);
        // console.log("Total time");
        // console.log("Done");


        // };


        // get the result of the run 

        // update the status of the submission using the api of the main service
        // done 

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