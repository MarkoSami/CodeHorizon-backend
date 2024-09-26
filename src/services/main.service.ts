import axios from "axios";


interface testCase {
    input: object;
    output: object;
    timeInMS: number;
    memoryInMB: number;
    problemId: string;
    id: string;
}

export default class MainService {
    private url: string | undefined;

    /**
     *
     */
    constructor() {
        this.url = process.env.MAIN_SERVICE_URL;
    }

    async getTestCases(problemId: string): Promise<testCase[]> {
        if (!this.url) {
            throw new Error("Main service URL is not defined");
        }

        const response = await axios.get(`${this.url}/problems/${problemId}/test-cases/`);
        console.log
        const data = response.data as { data: testCase[] };
        return data.data;
    }

    async getProblem(problemId: string): Promise<any> {
        try {
            if (!this.url) {
                throw new Error("Main service URL is not defined");
            }

            const response = await axios.get(`${this.url}/problems/${problemId}`);
            return response.data;

        } catch (error) {
            console.error("Error getting problem:", error);
        }

    }

    async updateTestCaseStatus(testCaseId: string, status: string): Promise<any> {
        if (!this.url) {
            throw new Error("Main service URL is not defined");
        }

        const response = await axios.put(`${this.url}/testCases/${testCaseId}`, { status });
        return response.data;
    }
}


