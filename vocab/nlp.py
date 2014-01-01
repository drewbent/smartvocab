from nltk.corpus import wordnet as wn
from nltk.corpus import PlaintextCorpusReader
import nltk.data, nltk.tag
import re

THESAURUS_KEY = 'd704e4f3ee89084366198a78c0dbfd46'
PUNCTUATION = """?'",:;!."""
POS_DICT = {'n': 'N', 'a': 'J', 'r': 'R', 'v': 'V'}
POS_DICT_WN = {'n': wn.NOUN, 'a': wn.ADJ, 'r': wn.ADV, 'v': wn.VERB}
# Can't use procedures like wup_similarity on words with these POS
POS_SIMILARITY_DISABLED = set(['adjective', 'adverb'])

TITLE_START_DELIMITER = '#(`*'
TITLE_END_DELIMITER = '*`)#'

# Unpickle POS tagger from RAM (takes a few seconds): bit.ly/M5xJEL
pos_tagger = nltk.data.load(nltk.tag._POS_TAGGER)
_MULTICLASS_NE_CHUNKER = 'chunkers/maxent_ne_chunker/english_ace_multiclass.pickle'
chunker = nltk.data.load(_MULTICLASS_NE_CHUNKER)

def create_corpus(dir, pattern='.*'):
    return PlaintextCorpusReader(dir, pattern)

def replace_original(sent, word, original):
    """Given a sentence, replace the synonym word with the original word that
    the user entered. Return a tuple: (title, sent, keywords)
    """
    if not original:
        # Exit early if there is no word to replace.
        return sent

    # TODO(drew): Should we split a word in half? (e.g.'cloy'ed)
    parts = sent.split(word)
    before, after = parts[0], parts[1]
    return before + original + after

def get_tagged_sentence(sent):
    """Return a tokenized sentence, tagged with POS."""
    tokens = nltk.word_tokenize(sent)
    return pos_tagger.tag(tokens)

def pos_match(sent_pos_tagged, word, pos):
    """Return whether a word has the right POS in the context of the sentence.
    """
    zipped = zip(*sent_pos_tagged)
    tokens, pos_of_words = zipped[0], zipped[1]
    for i, w in enumerate(tokens):
        # TODO(drew): only utilitizes the first character in the POS currently
        if w == word and pos_of_words[i][0] == POS_DICT[pos]:
            return True
    return False

def find_indices(content, word):
    """Return a list of indices where a word appears in the content."""
    i = 0
    indices = []
    while i < len(content):
        i = content.find(word, i)
        if i == -1:
            # Could not find word.
            break
        indices.append(i)
        i += len(word)
    return indices

def word_exists(word, content):
    """Return whether the word exists in the content.

    Use a regex to ensure that the word is surrounded by word breaks.
    """
    regex = r'\b%s\b' % word
    return re.search(regex, content)

def find_sents(word, pos, original=None):
    """Return a list of tuples (title, sentence, keywords) in which the
    sentence has the specified word in it.

    Consider the correct POS. Replace the synonym word with an original word if
    applicable.
    """
    result = []
    for corpus in corpora:
        for fileid in corpus.fileids():
            content = corpus.raw(fileid)
            # Only parse sentences if word exists in file.
            if word_exists(word, content):
                title = ''
                for paragraph in content.split('\n'):
                    # Update 'title' var if the current sentence is a title.
                    if TITLE_START_DELIMITER in paragraph:
                        regex = (re.escape(TITLE_START_DELIMITER) + '(.*)' +
                            re.escape(TITLE_END_DELIMITER))
                        pattern = re.compile(regex)
                        search = pattern.search(paragraph)
                        if search:
                            title = search.group(1)

                    # Collect sentences that use word with correct POS.
                    if word_exists(word, paragraph):
                        sents = nltk.sent_tokenize(paragraph)
                        for sent in sents:
                            if word_exists(word, sent):
                                sent_pos_tagged = get_tagged_sentence(sent)
                                if pos_match(sent_pos_tagged, word, pos):
                                    # Return a tuple, including the most recent
                                    # title.
                                    sent = replace_original(sent, word, original)
                                    # keywords = find_keywords(sent_pos_tagged)
                                    result.append((title, sent, []))

    return result

def find_keywords(sent_pos_tagged):
    """Given a sentence (with tagged POS), return keywords separated by commas.

    Only return words that are named entities.

    Note: this is a slow procedure.
    """
    tree = chunker.parse(sent_pos_tagged)
    # TODO(drew): trees can have two elements (first name and last name, Toy Story)
    keywords = [elem[0][0] for elem in tree if type(elem) == nltk.tree.Tree]
    keywords = list(set(keywords)) # removes redundant keywords
    return ', '.join(keywords)

def find_context(word, synset, pos):
    """Main method. Return the context of a vocabulary word.

    Call find_sents() with the word, and synonyms if needed. Threading makes
    this procedure quick.
    """
    sents = find_sents(word, pos)
    if sents:
        return sents
    else:
        for synonym in find_synonyms(synset, pos):
            sents = find_sents(synonym, pos, original=word)
            if sents:
                break

    return sents

def find_closest_meaning(a, b):
    """Return the synset that is the closest in between the two list of synsets
    """
    # TODO(drew): doesn't work for adjectives/adverbs: bit.ly/12cEcSR
    maxval = 0
    maxword = None
    for word_a in a:
        for word_b in b:
            curval = word_a.wup_similarity(word_b)
            if curval > maxval:
                maxval = curval
                maxword = word_a
    return maxword

def find_synonyms(synset, pos):
    """Return a list of synonyms, sorted by similarity to the original word.

    Consider the correct POS.
    """
    return [lemma.name for lemma in synset.lemmas]

corpus1 = create_corpus('vocab/static/corpora', pattern='justice.txt')
corpus2 = create_corpus('vocab/static/corpora', pattern='random.txt')
corpus3 = create_corpus('vocab/static/corpora', pattern='movies.txt')
corpora = [corpus1, corpus2, corpus3]
