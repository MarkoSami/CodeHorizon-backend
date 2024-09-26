import express from "express";
import { config } from "dotenv";
import MessageConsumer from "./RabbitMQ/MessageConsumer";
import Utils from "./lib/utils"


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
