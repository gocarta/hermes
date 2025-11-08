const crypto = require('node:crypto');
const dgram = require('node:dgram');
const { SQSClient, CreateQueueCommand } = require("@aws-sdk/client-sqs");
const test = require("flug");

test("sending message", async ({ eq }) => {
    const queue_name = crypto.randomUUID();

    const sqsClient = new SQSClient({ endpoint: "http://localhost:9324" });

    const command = new CreateQueueCommand({ QueueName: queue_name });
    const data = await sqsClient.send(command);
    const queueUrl = data.QueueUrl;

    process.env.HERMES_SQS_QUEUE_URL = queueUrl;
    require("./index.js");

    const client = dgram.createSocket('udp4');

    const message = Buffer.from('Hello, this is a test for queue ' + queue_name);

    await new Promise(resolve => {
        client.send(message, 5000, '127.0.0.1', (err) => {
            client.close();
            resolve();
        });
    });

    // wait two seconds for message to be set in the queue
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // fetch message from ElasticMQ SQS-Compatible interface
    const testUrl = queueUrl + "/messages?Action=ReceiveMessage";
    const response = await fetch(testUrl);
    const text = await response.text();
    eq(text.includes(message), true);
});
