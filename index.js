const dgram = require('node:dgram');
const http = require('node:http');
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const DEBUG = ["TRUE", "True", "T", "true", "t"].includes(process.env.HERMES_DEBUG);
const UDP_PORT = parseInt(process.env.HERMES_UDP_PORT || '5000');
const SQS_QUEUE_URL = process.env.HERMES_SQS_QUEUE_URL;

if (!SQS_QUEUE_URL) throw Error('[hermes] missing HERMES_SQS_QUEUE_URL');

const HEALTH_CHECK_PORT = parseInt(process.env.HERMES_HEALTH_CHECK_PORT || '8080');

const sqsClient = new SQSClient({
    useQueueUrlAsEndpoint: true
});
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', async (msg, rinfo) => {
    const rawMessage = msg.toString();
    if (DEBUG) {
        console.log(`[hermes] received message from ${rinfo.address}:${rinfo.port}: ${rawMessage}`);
    }

    try {
        const sendParams = {
            QueueUrl: SQS_QUEUE_URL,
            MessageBody: rawMessage,
            DelaySeconds: 0,
        };
        await sqsClient.send(new SendMessageCommand(sendParams));
        if (DEBUG) console.log('[hermes] message sent to SQS successfully');
    } catch (error) {
        console.error('[hermes] error sending message to SQS:', error);
    }
});

udpServer.on('listening', () => {
    const address = udpServer.address();
    if (DEBUG) console.log(`[hermes] UDP server listening on ${address.address}:${address.port}`);
});

udpServer.on('error', (err) => {
    if (DEBUG) console.error(`[hermes] UDP server error:\n${err.stack}`);
    udpServer.close();
});

udpServer.bind(UDP_PORT);

const healthCheckServer = http.createServer((req, res) => {
    if (udpServer.listening) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK\n');
    } else {
        res.writeHead(503);
        res.end('UDP server not listening\n');
    }
});

healthCheckServer.listen(HEALTH_CHECK_PORT, () => {
    if (DEBUG) console.log(`[hermes] TCP health check listening on port ${HEALTH_CHECK_PORT}`);
});
