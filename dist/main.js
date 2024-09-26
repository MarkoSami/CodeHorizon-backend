"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const promises_1 = require("fs/promises");
const MessageConsumer_1 = __importDefault(require("./RabbitMQ/MessageConsumer"));
const path_1 = require("path");
const dockerode_1 = __importDefault(require("dockerode"));
const docker = new dockerode_1.default();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, dotenv_1.config)();
        const messageConsumer = new MessageConsumer_1.default();
        const dockerode = require("dockerode");
        const docker = new dockerode();
        const app = (0, express_1.default)();
        app.use(express_1.default.json());
        const PORT = process.env.PORT || 3000;
        // consuming messages
        // messageConsumer.consumeMessages(process.env.QUEUE_NAME);
        app.get("/", (req, res) => {
            res.send("Code Runner Service is running");
        });
        app.post("/run", (req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log("Request body: ", req.body);
            const userCode = req.body.code;
            const codeParams = req.body.codeParams;
            const functionName = req.body.functionName;
            let codeRunnerFile = yield (0, promises_1.readFile)("./languageRunners/cpp/main.cpp", "utf8");
            const callLine = createCallLine(codeParams, functionName);
            console.log("======>", req.body.userCode);
            codeRunnerFile = codeRunnerFile.replace("$&{FINJECT}&$", userCode);
            codeRunnerFile = codeRunnerFile.replace("$&{FCALL}&$", callLine);
            console.log("======>Call Line", callLine);
            yield (0, promises_1.writeFile)("./languageRunners/cpp/runInstance.cpp", codeRunnerFile);
            yield buildAndRunLanguageContainer("cpp");
            res.send("Code Runner Service is running");
        }));
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    });
}
function createCallLine(codeParams, functionName) {
    let callLine = `${functionName}(`;
    // add every parameter to the call line
    codeParams.forEach((param, index) => {
        callLine += `data["${param}"]`;
        if (index < codeParams.length - 1) {
            callLine += ", ";
        }
    });
    callLine += ");";
    console.log("======>Call Line Inside", callLine);
    return callLine;
}
function buildAndRunLanguageContainer(language) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Build the Docker image
            const buildStream = yield docker.buildImage({
                context: (0, path_1.join)(__dirname, "../", "languageRunners", language), // Directory containing the Dockerfile
                src: ["Dockerfile", "runInstance.cpp"], // Files required for build
            }, { t: `${language}-code-runner` });
            // Handle the build stream
            buildStream.pipe(process.stdout, { end: true });
            buildStream.on("end", () => __awaiter(this, void 0, void 0, function* () {
                console.log("Build complete");
                // Run the Docker container
                const container = yield docker.createContainer({
                    Image: "cpp-code-runner",
                    Cmd: [
                        '{ "testCase":{"nums":[1,2,3,4,5,6,7],"target":9} }',
                    ],
                    Tty: false,
                    AttachStdout: true,
                    AttachStderr: true,
                });
                yield container.start();
                // Capture Stdout and Stderr
                container.logs({
                    follow: true,
                    stdout: true,
                    stderr: true,
                }, (err, stream) => {
                    if (err) {
                        console.error("Error retrieving logs:", err);
                        return;
                    }
                    if (stream) {
                        stream.on("data", (data) => {
                            const stringData = data
                                .toString("utf8")
                                .replace(/[^\x20-\x7E]/g, "");
                            console.log("========> string data", stringData);
                            // const jsonData = JSON.parse(stringData);
                            // console.log(jsonData.solution);
                        });
                        stream.on("end", () => {
                            console.log("Logs retrieval complete");
                        });
                    }
                });
                // Wait for the container to stop
                yield container.wait();
                // Remove the container after stopping
                yield container.remove();
            }));
        }
        catch (error) {
            console.error("Error building or running container:", error);
        }
    });
}
main();
//# sourceMappingURL=main.js.map