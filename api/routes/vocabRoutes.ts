import {
  list_all_words,
  create_a_word,
  read_a_word,
  update_a_word,
  delete_a_word,
} from '../controllers/vocabController';

export default (app: any): void => {
  app.route('/words')
    .get(list_all_words)
    .post(create_a_word);

  app.route('/words/:wordId')
    .get(read_a_word)
    .put(update_a_word)
    .delete(delete_a_word);
};