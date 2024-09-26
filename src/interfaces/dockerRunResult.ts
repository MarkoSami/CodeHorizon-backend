import Dockerode from "dockerode";

export default interface dockerRunResult {
    container: Dockerode.Container | null;
    result?: string;
    error?: string;
    memUsage?: number;
}