import express from 'express';
import { addContactUs } from '../controllers/contactusController';


const router = express.Router();
router.post('/', addContactUs);

export default router;