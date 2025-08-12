import express from 'express';
import { MqttTopicController } from '../controllers/MqttTopicController';

const router = express.Router();
const mqttTopicController = new MqttTopicController();

router.get('/', mqttTopicController.getAllTopics.bind(mqttTopicController));
router.post('/', mqttTopicController.createTopic.bind(mqttTopicController));
router.post('/publish', mqttTopicController.publishMessage.bind(mqttTopicController));
router.delete('/:id', mqttTopicController.deleteTopic.bind(mqttTopicController));

export default router;