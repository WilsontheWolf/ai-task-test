const ansi = {
    colours: {
        BLUE: "\u001b[34m",
        GREEN: "\u001b[32m",
        YELLOW: "\u001b[33m",
        RESET: "\u001b[0m",
    }
}

Object.keys(ansi.colours).forEach(colour => {
    if (colour === "RESET") return;
    ansi[colour] = function (str) {
        return `${ansi.colours[colour]}${str}${ansi.colours.RESET}`;
    }
});

export default ansi;