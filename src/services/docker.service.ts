import Dockerode, { Container } from "dockerode";
import { join } from "path";
import { dokcerBuildResult } from "../interfaces/dokcerBuildResult";
import dockerRunResult from "../interfaces/dockerRunResult";





export default class DockerService {


    private docker: Dockerode;
    constructor() {
        this.docker = new Dockerode();
    }


    async buildDockerImage(contextPath: string): Promise<dokcerBuildResult> {


        console.log("Building Docker image ");
        return new Promise((resolve, reject) => {
            this.docker.buildImage(
                {
                    context: contextPath,
                    src: ["Dockerfile", "runInstance.cpp"], // Ensure the file paths are correct
                },
                { t: `code-sandbox`, nocache: false }, // Tag the image
                (err, stream) => {
                    if (err) {
                        console.error("Error initiating build:", err);
                        return reject(err); // If there is an error initiating the build
                    }

                    let buildOutput = "";

                    // Process stream data (build logs)
                    stream?.on("data", (data) => {

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




    async createContainer(imageName: string, volumes: Object): Promise<Dockerode.Container> {
        // Check if container already exists
        if (await this.checkContainerExists(`${imageName}-container`)) {
            console.log("Container already exists");
            return this.docker.getContainer(`${imageName}-container`);
        }

        const container = await this.docker.createContainer({
            Image: imageName,
            name: `${imageName}-container`,
            Tty: true,
            HostConfig: {
                Binds: [
                    'D:/CodeHorizon/CodeHorizon-backend/languageRunners/cpp/runInstance.cpp:/usr/src/app/runInstance.cpp' // Correct format
                ]

            }
        });

        await container.start();
        return container;
    }


    async checkContainerExists(containerName: string): Promise<boolean> {
        try {
            const containers = await this.docker.listContainers();
            const exists = containers.some(container => container.Names.includes(`/${containerName}`));

            if (exists) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking container:', error);
            return false;
        }
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