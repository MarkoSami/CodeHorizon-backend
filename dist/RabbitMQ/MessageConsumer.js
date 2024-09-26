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
const amqplib_1 = __importDefault(require("amqplib"));
const amqplib_config_1 = __importDefault(require("../config/amqplib.config"));
class MessageConsumer {
    constructor() {
        this.channel = null;
    }
    createChannel() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.channel) {
                if (!amqplib_config_1.default.AMQP_URL) {
                    throw new Error("AMQP_URL not found in environment variables");
                }
                const connection = yield amqplib_1.default.connect(amqplib_config_1.default.AMQP_URL);
                this.channel = yield connection.createChannel();
            }
        });
    }
    consumeMessages(queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Consuming Messages");
            yield this.createChannel();
            if (!this.channel) {
                throw new Error("Channel not created");
            }
            const queue = yield this.channel.assertQueue(queueName, amqplib_config_1.default.QUEUE_OPTIONS);
            yield this.channel.bindQueue(queue.queue, "submission_exchange", "submission");
            this.channel.consume(queue.queue, (message) => this.handleMessage(message));
        });
    }
    handleMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!message) {
                return;
            }
            const data = JSON.parse(message.content.toString());
            console.log("Message Received: ", message.content.toString());
            // handle message
            (_a = this.channel) === null || _a === void 0 ? void 0 : _a.ack(message);
        });
    }
}
exports.default = MessageConsumer;
;
//# sourceMappingURL=MessageConsumer.js.map