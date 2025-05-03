const amqp = require('amqplib');

class RabbitMQClient {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = process.env.RABBITMQ_URL || 'amqp://mademe:mademe_password@rabbitmq:5672';
    this.retryAttempts = 0;
    this.maxRetryAttempts = 10;
    this.retryInterval = 5000; // 5 seconds
  }

  async connect() {
    try {
      console.log(`Connecting to RabbitMQ at ${this.url}...`);
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      console.log('Connected to RabbitMQ successfully!');
      
      // Reset retry counters
      this.retryAttempts = 0;
      
      // Handle connection closing
      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed! Attempting to reconnect...');
        this.reconnect();
      });
      
      // Handle errors
      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
        this.reconnect();
      });
      
      return this.channel;
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error.message);
      this.reconnect();
      return null;
    }
  }
  
  async reconnect() {
    if (this.retryAttempts >= this.maxRetryAttempts) {
      console.error(`Maximum retry attempts (${this.maxRetryAttempts}) reached. Giving up on RabbitMQ connection.`);
      return;
    }
    
    this.retryAttempts++;
    console.log(`Attempting to reconnect to RabbitMQ (attempt ${this.retryAttempts}/${this.maxRetryAttempts}) in ${this.retryInterval}ms...`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection attempt failed:', error.message);
      }
    }, this.retryInterval);
  }
  
  async createQueue(queueName) {
    if (!this.channel) {
      await this.connect();
    }
    
    try {
      await this.channel.assertQueue(queueName, {
        durable: true
      });
      console.log(`Queue '${queueName}' created or already exists`);
    } catch (error) {
      console.error(`Error creating queue '${queueName}':`, error.message);
      throw error;
    }
  }
  
  async publishMessage(queueName, message) {
    if (!this.channel) {
      await this.connect();
    }
    
    try {
      await this.createQueue(queueName);
      
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const result = this.channel.sendToQueue(queueName, messageBuffer, {
        persistent: true // message will survive broker restarts
      });
      
      console.log(`Message sent to queue '${queueName}':`, message);
      return result;
    } catch (error) {
      console.error(`Error publishing message to queue '${queueName}':`, error.message);
      throw error;
    }
  }
  
  async consumeMessages(queueName, callback) {
    if (!this.channel) {
      await this.connect();
    }
    
    try {
      await this.createQueue(queueName);
      
      console.log(`Starting to consume messages from queue '${queueName}'...`);
      
      this.channel.consume(queueName, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Received message from queue '${queueName}':`, content);
            
            // Process the message with the provided callback
            await callback(content);
            
            // Acknowledge the message (remove from queue)
            this.channel.ack(msg);
          } catch (error) {
            console.error(`Error processing message from queue '${queueName}':`, error.message);
            // Reject the message and requeue it
            this.channel.nack(msg, false, true);
          }
        }
      });
      
      console.log(`Consumer setup complete for queue '${queueName}'`);
    } catch (error) {
      console.error(`Error consuming messages from queue '${queueName}':`, error.message);
      throw error;
    }
  }
  
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('RabbitMQ connection closed gracefully');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error.message);
    }
  }
}

// Create a singleton instance
const rabbitMQ = new RabbitMQClient();

module.exports = rabbitMQ;