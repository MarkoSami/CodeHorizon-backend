"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QUEUE_OPTIONS = {
    durable: true,
    execlusive: false,
    autoDelete: false,
};
const AMQP_URL = process.env.AMQP_URL;
exports.default = {
    QUEUE_OPTIONS,
    AMQP_URL,
};
//# sourceMappingURL=amqplib.config.js.map