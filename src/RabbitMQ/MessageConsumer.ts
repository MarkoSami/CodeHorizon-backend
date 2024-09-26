import amqplib, { ConsumeMessage } from "amqplib";

import amqplibConfig from "../config/amqplib.config";
import Utils from "../lib/utils";

export default class MessageConsumer {

  private channel: amqplib.Channel | null;
  private url: string | undefined;

  constructor() {
    this.channel = null;
    this.url = process.env.AMQP_URL;
  }

  async createChannel() {
    if (!this.channel) {
      if (!this.url) {
        throw new Error("AMQP_URL not found in environment variables");
      }
      const connection = await amqplib.connect(this.url);
      this.channel = await connection.createChannel();
    }
  }

  async consumeMessages(queueName: string) {
    console.log("Consuming Messages");
    await this.createChannel();

    if (!this.channel) {
      throw new Error("Channel not created");
    }
    const queue = await this.channel.assertQueue(
      queueName,
      amqplibConfig.QUEUE_OPTIONS
    );
    await this.channel.bindQueue(
      queue.queue,
      "submission_exchange",
      "submission"
    );

    this.channel.consume(queue.queue, (message) => this.handleMessage(message));
  }

  async handleMessage(message: ConsumeMessage | null) {

    if (!message) {
      return;
    }
    // Convert message content to string and parse the JSON
    const data = JSON.parse(message.content.toString());

    // Log the entire parsed message (including the `code` field)
    // console.log("Message Received: ", data);


    // handle message
    Utils.handleSubmissionMessage(data);

    this.channel?.ack(message);
  }
};
