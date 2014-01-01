from django.http import HttpResponse
from django.template import RequestContext, loader
from django.utils import simplejson
from nltk.corpus import wordnet as wn
from django.conf import settings
import nlp

POS_list = [wn.NOUN, wn.ADJ, wn.ADV, wn.VERB]

def index(request):
    template = loader.get_template('vocab/index.html')
    context = RequestContext(request, {
        'num_of_words': range(5),
        'on_heroku': settings.ON_HEROKU
    })
    return HttpResponse(template.render(context))

def definitions(request, word):
    data = {}
    for POS in POS_list:
        definitions = [synset.definition for synset in wn.synsets(word, POS)]
        if definitions:
            data[POS] = definitions

    data = simplejson.dumps(data)

    return HttpResponse(data, mimetype='application/json')

def sentences(request):
    data = {}

    for k, v in request.GET.items():
        word = k
        pos = v[0]
        def_num = v[1]

        synset = wn.synset(word + '.' + pos + '.0' + def_num)
        #for context in nlp.find_context(word, synset, pos):
        contexts = nlp.find_context(word, synset, pos)
        definition = synset.definition
        if contexts:
            context = contexts[0]
            data[word] = [definition, def_num, pos, context[0], context[1],
                context[2]]
        else:
            data[word] = [definition, def_num, pos, '', '', '']

    data = simplejson.dumps(data)

    return HttpResponse(data, mimetype='application/json')

