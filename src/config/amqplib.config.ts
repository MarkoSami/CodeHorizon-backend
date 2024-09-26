

const QUEUE_OPTIONS = {
  durable: true,
  execlusive: false,
  autoDelete: false,

}
const AMQP_URL = process.env.AMQP_URL;





export default {
  QUEUE_OPTIONS,
  AMQP_URL,
};
