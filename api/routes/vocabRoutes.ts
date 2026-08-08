import {
  list_all_words,
  create_a_word,
  read_a_word,
  update_a_word,
  delete_a_word,
} from '../controllers/vocabController';

import { requireAuth } from '../middleware/authMiddleware';

export default (app: any): void => {

  app.route('/words')
    .get(requireAuth, list_all_words)
    .post(requireAuth, create_a_word);

  app.route('/words/:wordId')
    .get(requireAuth, read_a_word)
    .put(requireAuth, update_a_word)
    .delete(requireAuth, delete_a_word);
};