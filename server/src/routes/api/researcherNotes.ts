import express from 'express';
import passport from 'passport';
import mongoose from 'mongoose';
import ResearcherNote, { IResearcherNote } from '../../models/ResearcherNote';

const router = express.Router();

/**
 * @desc Error response helper
 */
function err(msg: string) {
  return { success: false, error: msg };
}

/**
 * @route GET /api/notes/:participantId
 * @desc Retrieve all researcher notes for a given participant
 * @access Private (only authenticated researchers)
 */
router.get(
  '/:participantId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const participantId = req.params.participantId;

    if (!participantId) {
      res.status(400).json(err('Invalid or missing participant ID'));
      return;
    }

    try {
      const notes: IResearcherNote[] = await ResearcherNote.find({ participant: participantId })
        .populate('researcher', 'firstName lastName email')
        .sort({ createdAt: 1 });
      res.status(200).json({ success: true, notes });
      return;
    } catch (error) {
      console.error(`Error retrieving notes for participant ${participantId}:`, error);
      res.status(500).json({ success: false, message: 'Internal server error', error });
      return;
    }
  }
);

/**
 * @route POST /api/notes/:participantId
 * @desc Create a new researcher note for a participant
 * @access Private (only authenticated researchers)
 */
router.post(
  '/:participantId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const participantId = req.params.participantId;
    const researcherId = req.user.id;
    const { note } = req.body;

    if (!participantId) {
      res.status(400).json(err('Invalid or missing participant ID'));
      return;
    }
    if (!note || typeof note !== 'string' || note.trim() === '') {
      res.status(400).json(err('Note text is required'));
      return;
    }

    try {
      const newNote = new ResearcherNote({
        participant: participantId,
        researcher: researcherId,
        note: note.trim(),
      });

      const savedNote = await newNote.save();
      const populatedNote = await savedNote.populate('researcher', 'firstName lastName email');
      res.status(201).json({ success: true, note: populatedNote });
      return;
    } catch (error) {
      console.error(`Error creating note for participant ${participantId}:`, error);
      res.status(500).json({ success: false, message: 'Internal server error', error });
      return;
    }
  }
);


/**
 * @route PUT /api/notes/:participantId/:noteId
 * @desc Update an existing researcher note. Only the researcher who created the note may update it.
 * @access Private (only authenticated researchers)
 */
router.put(
  '/:participantId/:noteId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { participantId, noteId } = req.params;
    const researcherId = req.user.id;
    const { note } = req.body;

    if (!participantId) {
      res.status(400).json(err('Invalid or missing participant ID'));
      return;
    }

    
    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json(err('Invalid or missing note ID'));
      return;
    }
    if (!note || typeof note !== 'string' || note.trim() === '') {
      res.status(400).json(err('Note text is required'));
      return;
    }

    try {
      const existingNote = await ResearcherNote.findById(noteId);

      if (!existingNote) {
        res.status(404).json(err('Note not found'));
        return;
      }

      if (existingNote.participant !== participantId) {
        res.status(400).json(err('Note does not belong to the specified participant'));
        return;
      }

      if (existingNote.researcher.toString() !== researcherId) {
        res.status(401).json(err('You are not authorized to update this note'));
        return;
      }

      existingNote.note = note.trim();
      const updatedNote = await existingNote.save();


      res.status(200).json({ success: true, note: updatedNote });
      return;
    } catch (error) {
      console.error(`Error updating note ${noteId} for participant ${participantId}:`, error);
      res.status(500).json({ success: false, message: 'Internal server error', error });
      return;
    }
  }
);

/**
 * @route DELETE /api/notes/:participantId/:noteId
 * @desc Delete an existing researcher note. Only the researcher who created the note may delete it.
 * @access Private (only authenticated researchers)
 */
router.delete(
  '/:participantId/:noteId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { participantId, noteId } = req.params;
    const researcherId = req.user.id;

    if (!participantId) {
       res.status(400).json(err('Invalid or missing participant ID'));
       return
    }
    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
       res.status(400).json(err('Invalid or missing note ID'));
       return
    }

    try {
      const existingNote = await ResearcherNote.findById(noteId);

      if (!existingNote) {
         res.status(404).json(err('Note not found'));
         return
      }
      // Ensure it belongs to the specified participant
      if (existingNote.participant !== participantId) {
         res.status(400).json(err('Note does not belong to the specified participant'));
         return
      }
      // Ensure current researcher is the creator of the note
      if (existingNote.researcher.toString() !== researcherId) {
         res.status(401).json(err('You are not authorized to delete this note'));
         return
      }

      await existingNote.deleteOne();
       res.status(200).json({ success: true, message: 'Note deleted successfully' });
       return
    } catch (error) {
      console.error(`Error deleting note ${noteId} for participant ${participantId}:`, error);
       res.status(500).json({ success: false, message: 'Internal server error', error });
       return
    }
  }
);

export default router;
