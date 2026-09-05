/**
 * Workflow routes
 */

import { Router } from 'express';
import {
  generateWorkflowHandler,
  regenerateNodeHandler,
  editWorkflowHandler,
} from '../controllers/workflowController';

const router = Router();

// POST /api/workflow/generate
router.post('/generate', generateWorkflowHandler);

// POST /api/workflow/regenerate
router.post('/regenerate', regenerateNodeHandler);

// POST /api/workflow/edit
router.post('/edit', editWorkflowHandler);

export default router;
