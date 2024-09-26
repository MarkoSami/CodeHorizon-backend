import Dockerode from "dockerode";
import { join } from "path";
import { dokcerBuildResult } from "../interfaces/dokcerBuildResult";
import dockerRunResult from "../interfaces/dockerRunResult";





export default class DockerService {


    private docker: Dockerode;
    constructor() {
        this.docker = new Dockerode();
    }


    async buildDockerImage(language: string): Promise<dokcerBuildResult> {
        return new Promise((resolve, reject) => {
            this.docker.buildImage(
                {
                    context: join(__dirname, `../../languageRunners/${language}`),
                    src: ["Dockerfile", "runInstance.cpp"], // Ensure the file paths are correct
                },
                { t: `language-runner-${language}` }, // Tag the image
                (err, stream) => {
                    if (err) {
                        console.error("Error initiating build:", err);
                        return reject(err); // If there is an error initiating the build
                    }

                    let buildOutput = "";

                    // Process stream data (build logs)
                    stream?.on("data", (data) => {
                        const log = this.handleDockerLog(data.toString());
                        if (log.error) {
                            console.log("Error building container:", log.errorDetail);
                            return reject(new Error(log.errorDetail.message));
                        }



                        buildOutput += data.toString();
                    });

                    // Stream end - build finished
                    stream?.on("end", () => {
                        console.log("Docker build completed.");
                        resolve({
                            error: false,
                            buildOutput: buildOutput,
                        });
                    });

                    // Handle stream errors
                    stream?.on("error", (error) => {
                        console.error("Stream error during build:", error);
                        reject(error);
                    });
                }
            );
        });
    }




    async createContainer(imageName: string) {
        const container = await this.docker.createContainer({
            Image: imageName,
            name: `${imageName}-container`,
            Tty: true,
        });

        await container.start();
        return container;
    }




    async cleanupStoppedContainers() {
        try {
            const containers = await this.docker.listContainers({ all: true, filters: { status: ['exited'] } });
            const containerIds = containers.map(container => container.Id);

            if (containerIds.length > 0) {
                await Promise.all(containerIds.map(id => this.docker.getContainer(id).remove()));
                console.log(`Removed stopped containers: ${containerIds.join(", ")}`);
            } else {
                console.log("No stopped containers to remove.");
            }
        } catch (error) {
            console.error(`Error cleaning up stopped containers: ${error}`);
        }
    }

    handleDockerLog(log: string): dokcerBuildResult {


        const objs = log.toString().split("\n");
        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            if (obj.trim() === "") continue;
            const parsed = JSON.parse(obj.trim());
            if (parsed.errorDetail) {
                {
                    return {
                        error: true,
                        errorDetail: parsed.errorDetail.message
                    };
                }

            }
        };
        return {
            error: false,
            buildOutput: ""
        };
    }
}