// Follow Mozilla's guide: http://mzl.la/PgkijK

function Quiz(data) {
    var cards = new Array();
    for (var word in data) {
        var card = new Card(new Word(word, data[word]));
        cards.push(card);
    }
    this.cards = cards;
    this.currentCardIndex = 0;
    this.currentColorIndex = 0;
    this.updateUI();
    this.initializeEvents();
}

function Card(word) {
    this.word = word;
    this.front = true; // front or back
}

// TODO(drew): We don't need this type.
function Word(name, sentence) {
    this.name = name;
    this.sentence = sentence;
}

Quiz.prototype.updateUI = function() {
    var currentCard = this.cards[this.currentCardIndex];
    var front = currentCard.front;

    var quiz = $("#quiz");
    quiz.empty();

    if (front) {
        var color = Card.colors[this.currentColorIndex];
        quiz.append(currentCard.getFrontUI(color));
    } else {
        var color = Card.fadedColors[this.currentColorIndex];
        quiz.append(currentCard.getBackUI(color));
    }
};

Quiz.prototype.initializeEvents = function() {
    var quiz = this;
    $("#quiz").on("click", ".quiz-card", function() {
        // quiz.nextCard();
        //quiz.flip({
        //direction:'tb'
        ///})
    });
};

// TODO(drew): A more elegant solution? Iterators?
Quiz.prototype.nextCard = function() {
    var currentCard = this.cards[this.currentCardIndex];
    if (currentCard.front) {
        currentCard.front = false;
        this.updateUI();
    } else {
        currentCard.front = true;
        this.currentCardIndex++
        this.currentColorIndex++;

        if (this.currentCardIndex >= this.cards.length) {
            this.currentCardIndex = 0;
        }
        if (this.currentColorIndex >= Card.colors.length) {
            this.currentColorIndex = 0;
        }
    }

    this.updateUI();
};

Card.prototype.getFrontUI = function(color) {
    return this.getUI(color, this.word.name, "front");
};

Card.prototype.getBackUI = function(color) {
    var sentence = this.word.sentence,
        name = this.word.name;
    sentence = sentence.replace(name, "<b>" + name + "</b>")
    return this.getUI(color, sentence, "back");
};

Card.prototype.getUI = function(color, content, style) {
    var div = $("<div class=\"quiz-card " + style + "\" style=\"background-color:"
        + color + "\"><div class=\"quiz-card-vertical-align\">" + content +
        "</div></div>");

    // Disable text selection.
    div
        .attr('unselectable', 'on')
        .css('user-select', 'none')
        .on('selectstart', false);

    return div;
};

// https://kuler.adobe.com/#themeID/1993286
Card.colors = ["#379154", "#39B4BF", "#FFE666", "#946FB0", "#E54E67"];
Card.fadedColors = ["#549168", "#60B7BF", "#FFEE99", "#A392B0", "#E57C8E"];