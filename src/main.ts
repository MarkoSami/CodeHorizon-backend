import express from "express";
import { config } from "dotenv";
import MessageConsumer from "./RabbitMQ/MessageConsumer";
import Utils from "./lib/utils"
import colors from "colors";


async function main() {
  config();

  const messageConsumer = new MessageConsumer();

  const app = express();

  app.use(express.json());


  const PORT = process.env.PORT || 3000;

  // consuming messages
  messageConsumer.consumeMessages("SUBMISSION_QUEUE");

  app.get("/", (req, res) => {
    res.send("Code Runner Service is running");
  });

  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Total memory usage in MB
    const totalMemory = (memoryUsage.rss / 1024 / 1024).toFixed(2);

    // Total CPU usage: User + System in milliseconds
    const totalCpu = ((cpuUsage.user + cpuUsage.system) / 1000).toFixed(2);

    // Output memory and CPU usage with color
    console.log("_____________________________________________________\n");
    console.log(colors.blue(`Memory Usage: ${colors.bold(totalMemory)} MB`));
    console.log(colors.green(`CPU Usage: ${colors.bold(totalCpu)} ms`));
    console.log("_____________________________________________________\n");


  }, 10000); // Log every 5 seconds


  // app.post("/run", async (req, res) => {
  //   console.log("Request body: ", req.body);
  //   const userCode = req.body.code;
  //   const codeParams = req.body.codeParams;
  //   const functionName = req.body.functionName;


  //   await Utils.injectCode("./languageRunners/cpp/main.cpp", Utils.createCallLine(codeParams, functionName), userCode);

  //   await Utils.buildAndRunLanguageContainer("cpp");

  //   res.send("Code Runner Service is running");
  // });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}




main();
