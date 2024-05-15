const ansi = {
    colours: {
        BLUE: "\u001b[34m",
        GREEN: "\u001b[32m",
        YELLOW: "\u001b[33m",
        PURPLE: "\u001b[35m",
        RED: "\u001b[31m",
        RESET: "\u001b[0m",
    },
    printMessage: function (message) {
        let fn;
        if (message.role === "system") {
            fn = ansi.PURPLE;
        } else if (message.role === "user") {
            fn = ansi.BLUE;
        } else {
            fn = ansi.GREEN;
        }
        console.log(`${fn(message.content)}${ansi.colours.RESET}`);
    },
}

Object.keys(ansi.colours).forEach(colour => {
    if (colour === "RESET") return;
    ansi[colour] = function (str) {
        return `${ansi.colours[colour]}${str}${ansi.colours.RESET}`;
    }
});


export default ansi;