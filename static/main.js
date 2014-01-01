var focusedInput;
var isLastWordFocused;

var posDict = {
    "n": "N",
    "v": "V",
    "a": "ADJ",
    "r": "ADV"
};

$("#setup")
    .on("click", ".word-input", function() {
        isLastWordFocused = isLastWord(focusedInput);
    })
    .on("focus", ".word-input", function() {
        focusedInput = $(this);
        //isLastWordFocused = isLastWord(focusedInput);
        })
    .on("blur", ".word-input", function() {
        var jel = $(this);
        var word = jel.val();
        var url = "definitions/" + word;

        // Only search for possible definitions if input isn't empty and a
        // definition hasn't been specified aleady.
        if (word.length && !jel.attr("data-definition-id")) {
            $.getJSON(url, onReceiveDefinitions.bind({ jel: jel }));
        }
    })
    .on("click", ".popover .definitions a", function(e) {
        var popover = $(this).parents(".popover"),
            definitionId = $(this).attr("data-definition-id"),
            input = popover.siblings("input");

        popover.remove();

        input.attr("data-definition-id", definitionId)

        highlightSuccess(input);

        // Return focus to previously selected input.
        focusInput(focusedInput);

        e.preventDefault();
    })
    .on("click", "button.submit", function(e) {
        var inputs = $("input.word-input");
        var data = {};
        $.each(inputs, function(index, value) {
            var definitionId = $(value).attr("data-definition-id");
            var word = $(value).val();
            if (definitionId) {
                data[word] = definitionId;
            }
        });

        // Fade out #setup and start loading icon
        $("#setup").fadeTo("fast", 0);
        startLoading();
        $.getJSON("sentences", data, onReceiveSentences);
    });

var onReceiveDefinitions = function(data) {
    // Only display definitions if the word can be found to have multiple
    // definitions or POS's.
    // TODO(drew): default definition numbers
    var display = (!$.isEmptyObject(data) && (Object.keys(data).length > 1 ||
        data[Object.keys(data)[0]].length > 1));

    if (display) {
        displayDefinitions.call({ jel: this.jel }, data);
    } else {
        if ($.isEmptyObject(data)) {
            highlightFailure(this.jel);
        } else {
            var definitionId = Object.keys(data) + "1";
            this.jel.attr("data-definition-id", definitionId);

            highlightSuccess(this.jel);
        }
    }
};

var onReceiveSentences = function(data) {
    $("#setup").remove();
    stopLoading();

    var quiz = new Quiz(data);
};

var displayDefinitions = function(data) {
    var popoverContent = "";

    // TODO(drew): Use a template engine like Handlebars
    $.each(data, function(key, val) {
        popoverContent += "<div class=\"POS-and-definitions\">";

        popoverContent += "<span class=\"POS\">" + posDict[key] +
            "</span>";
        popoverContent += "<span class=\"definitions\">"

        for (var i=0; i<Math.min(val.length, 3); i++) {
            var definition = val[i].substring(0, 35) + "...";
            popoverContent += "<a href=\"#\" data-definition-id=\"" + key +
                 (i + 1) + "\" tabindex=\"-1\">";
            popoverContent += (i + 1) + ". " + definition + "<br>";
            popoverContent += "</a>";
        }
        popoverContent += "</span>";

        popoverContent += "</div>";
    });

    var wordNumber = this.jel.attr("data-word-number");
    var evenWordNumber = (wordNumber % 2 == 0);
    this.jel.popover({
        content: popoverContent,
        placement: evenWordNumber ? "right" : "left",
        html: "true",
        trigger: "manual",
        animate: true,
    }).popover("show");
};

$(document).keydown(function(e) {
    // Prevent tab behavior if last word is focused.
    if (e.keyCode == 9 && isLastWordFocused) {
        e.preventDefault();
    }
});

$("body").keyup(function(e) {
    // Add word input if tab is clicked and the last word input is focused.
    var code = e.keyCode || e.which;
    if (code == '9' && isLastWordFocused) {
        var word = addWord();
    }
    if (code == '9') {
        isLastWordFocused = isLastWord(focusedInput);
    }
});

var highlightSuccess = function(jel) {
    jel.effect("highlight", {color: "#BCED91"}, 800);
};

var highlightFailure = function(jel) {
    jel.effect("highlight", {color: "#EE6363"}, 800);
};

var focusInput = function(jel) {
    focusedInput = jel;
    isLastWordFocused = isLastWord(focusedInput);
    jel.focus();
};

var getWordNumber = function(jel) {
    return jel.attr("data-word-number");
};

var isLastWord = function(jel) {
    var parent = jel.parents(".setup-word");
    return !parent.nextAll(".setup-word").length;
};

var addWord = function() {
    var container = $("#setup").children(".setup-word").last(),
        newContainer = container.clone(),
        word = container.find("input"),
        newWord = newContainer.find("input"),
        num = parseInt(getWordNumber(word), 10),
        newNum = num + 1,
        name = word.attr("name"),
        newName = name.substring(0, name.length-1) + newNum;

    newWord
        .attr("data-word-number", newNum)
        .attr("name", newName)
        .val("");

    container.after(newContainer);

    focusInput(newWord);

    return newWord;
};

$("a.add-word").on("click", function(e) {
    addWord();
    e.preventDefault();
});

var startLoading = function() {
    $("#loading img").removeClass("hidden");
};

var stopLoading = function() {
    $("#loading img").addClass("hidden");
};