import express from 'express';
import { TopicMessageController } from '../controllers/TopicMessageController';

const router = express.Router({ mergeParams: true });
const topicMessageController = new TopicMessageController();

// GET /api/v1/topics/:topicId/topicMessages
router.get('/', topicMessageController.getMessagesByTopicId.bind(topicMessageController));

export default router;