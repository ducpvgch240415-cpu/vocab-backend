import Vocab from '../models/vocabModel';

export const list_all_words = async (_req: any, res: any): Promise<void> => {
  try {
    const words = await Vocab.find({});
    res.json(words);
  } catch (err) {
    res.status(500).send(err);
  }
};


export const create_a_word = async (req: any, res: any): Promise<void> => {
  try {

    const newWord = new Vocab(req.body);
    const word = await newWord.save();
    res.status(201).json(word);
    
  } catch (err) {
    res.status(500).send(err);
  }
};


export const read_a_word = async (req: any, res: any): Promise<void> => {
  try {
    const word = await Vocab.findById(req.params.wordId);
    if (!word) {
      res.status(404).json({ message: 'Word not found' });
      return;
    }
    res.json(word);
  } catch (err) {
    res.status(500).send(err);
  }
};

export const update_a_word = async (req: any, res: any): Promise<void> => {
  try {
    const word = await Vocab.findOneAndUpdate(
      { _id: req.params.wordId },
      req.body,
      { returnDocument: 'after' }
    );
    res.json(word);
  } catch (err) {
    res.status(500).send(err);
  }
};

export const delete_a_word = async (req: any, res: any): Promise<void> => {
  try {
    await Vocab.deleteOne({ _id: req.params.wordId });
    res.json({
      message: 'Word successfully deleted',
      _id: req.params.wordId,
    });
  } catch (err) {
    res.status(500).send(err);
  }
};

  