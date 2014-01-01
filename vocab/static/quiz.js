// Follow Mozilla's guide: http://mzl.la/PgkijK

function Quiz(data) {
    this.cards = new Array();
    this.addCard(data)
    this.currentCardIndex = 0;
    this.currentColorIndex = 0;
    this.numOfCardsShown = 0;
    this.updateUI();
    this.initializeEvents();
}

function Card(word, definition, definitionNum, pos, title, sentence, keywords) {
    this.word = word;
    this.definition = definition;
    this.definitionNum = definitionNum;
    this.pos = pos;
    this.title = title;
    this.sentence = sentence;
    this.keywords = keywords;
    this.front = true; // front or back

    // The card with the highest score is shown to the user.
    this.score = 0;
    // Cards with higher scoreMultipliers are shown more frequently.
    this.scoreMultiplier = 5;
}

Quiz.prototype.addCard = function(data) {
    // Idiomatic way, even though there's only element in data
    for (var word in data) {
        // [definition, definitionNumber, POS, title, sentence, keywords]
        var cardData = data[word];
        var card = new Card(word, cardData[0], cardData[1], cardData[2],
             cardData[3], cardData[4], cardData[5]);

        // Restore score to what it should be (i.e. don't penalize cards added
        // after the quiz started.)
        card.score = this.numOfCardsShown * card.scoreMultiplier;
        this.cards.push(card);
    }
};

Quiz.prototype.updateUI = function() {
    var currentCard = this.cards[this.currentCardIndex];
    var front = currentCard.front;

    var quizDiv = $("#quiz");
    var quiz = this;

    var color;
    if (front) {
        color = Card.colors[this.currentColorIndex];
        currentCard.score = 0;
        quiz.numOfCardsShown++;
    } else {
        color = Card.fadedColors[this.currentColorIndex];
    }

    if (!$(".quiz-card").length) {
        quizDiv.append(currentCard.getFrontUI(color));
    } else {
        // animate card flip
        $(".quiz-card").flip({
            direction: front ? 'rl' : 'tb',
            speed: 400,
            color: color,
            onEnd: function() {
                quizDiv.empty();
                if (front) {
                    quizDiv.append(currentCard.getFrontUI(color));
                } else {
                    quizDiv.append(currentCard.getBackUI(color));
                    quiz.initializeCardEvents(quiz, currentCard);
                }
            }
        });
    }
};

Quiz.prototype.updateScores = function() {
    for (var i=0; i<this.cards.length; i++) {
        var card = this.cards[i];
        card.score += card.scoreMultiplier;
    }
};

Quiz.prototype.getCardIndexWithHighestScore = function() {
    var maxScore = 0;
    var maxIndex = 0;
    for (var i=0; i<this.cards.length; i++) {
        var card = this.cards[i];
        if (card.score >= maxScore) {
            maxIndex = i;
            maxScore = card.score;
        }
    }
    return maxIndex;
};

Quiz.prototype.initializeEvents = function() {
    var quiz = this;
    $("#quiz").on("click", ".quiz-card.front", function() {
        quiz.nextCard();
    });
    $(document).keydown(function(e) {
        if (e.keyCode == 39) {
             // quiz.nextCard();
        }
    });
};

Quiz.prototype.initializeCardEvents = function(quiz, card) {
    $(".quiz-card-footer span").tooltip({
        animation: false,
        placement: "bottom"
    });
    $(".quiz-card-footer span").on("click", function() {
        var scoreMultiplier = 5 - $(this).index();
        card.scoreMultiplier = scoreMultiplier;
        quiz.nextCard();
    });
};

// TODO(drew): A more elegant solution? Iterators?
Quiz.prototype.nextCard = function() {
    var currentCard = this.cards[this.currentCardIndex];
    if (currentCard.front) {
        currentCard.front = false;
    } else {
        currentCard.front = true;
        this.currentCardIndex = this.getCardIndexWithHighestScore();
        this.currentColorIndex++;

        if (this.currentColorIndex >= Card.colors.length) {
            this.currentColorIndex = 0;
        }
    }
    this.updateScores();
    this.updateUI();
};

Card.prototype.getFrontUI = function(color) {
    return this.getUI(color, this.word, "front");
};

Card.prototype.getBackUI = function(color) {
    var sentence = this.sentence,
        word = this.word;
    sentence = sentence.replace(word, "<b>" + word + "</b>")
    var content = "<div class=\"quiz-card-header\">" +
        posDict[this.pos].toLowerCase() + ". " + this.definition +
        "</div><div class=\"quiz-card-content\"><h2>" + this.title + "</h2>" +
        sentence + "</div><div class=\"quiz-card-footer\"><span title=\"I don't know the word\" class=\"rank-number\">1</span>" +
        "<span title=\"I know the word a little\" class=\"rank-number\">2</span><span title=\"I sort of know the word\" class=\"rank-number\">" +
        "3</span><span title=\"I almost know the word\" class=\"rank-number\">4</span><span title=\"I know the word\" class=\"rank-number\">5</span></div>";
    return this.getUI(color, content, "back");
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

Quiz.prototype.setUpHashURL = function(paramDataForHashURL) {
    //var data = {};
    //$.each(this.cards, function(index, card) {
    //    var word = card.word;
    //    var pos = card.pos;
    //    var definitionNum = card.definitionNum;

    //    data[word] = pos + definitionNum;
    //});

    window.location.hash = paramDataForHashURL;
};

// https://kuler.adobe.com/#themeID/1993286
Card.colors = ["#379154", "#39B4BF", "#946FB0", "#E54E67"]; // #FFE666
Card.fadedColors = ["#549168", "#60B7BF", "#A392B0", "#E57C8E"]; // #FFEE99