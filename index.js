const QUOTE_API_URL = "https://zenquotes.io/api/random";

const demoQuotes = [
    { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
    { quote: "Well done is better than well said.", author: "Benjamin Franklin" },
    { quote: "Let your enemies be the camera, smile everytime you see them.", author: "Usanda Nkukwana" }
];

const quoteText = document.getElementById("quote-text");
const quoteAuthor = document.getElementById("quote-author");
const newQuoteButton = document.getElementById("new-quote");
const statusMessage = document.getElementById("status");

function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `daily-quote-${year}-${month}-${day}`;
}

function displayQuote(quote) {
    quoteText.textContent = `“${quote.quote}”`;
    quoteAuthor.textContent = quote.author ? `— ${quote.author}` : "";
}

function getDemoQuote() {
    const currentText = quoteText.textContent.replace(/[“”]/g, "");
    const choices = demoQuotes.filter((q) => q.quote !== currentText);
    const pool = choices.length ? choices : demoQuotes;
    return { ...pool[Math.floor(Math.random() * pool.length)], source: "demo" };
}

function fetchQuote() {
    return new Promise((resolve, reject) => {
        const callbackName = "zenQuoteCallback_" + Date.now();
        const script = document.createElement("script");

        window[callbackName] = (data) => {
            delete window[callbackName];
            script.remove();

            const item = Array.isArray(data) ? data[0] : data;
            if (!item || typeof item.q !== "string" || !item.q.trim()) {
                return reject(new Error("Unexpected quote response shape."));
            }
            resolve({
                quote: item.q.trim(),
                author: typeof item.a === "string" ? item.a.trim() : "",
                source: "api"
            });
        };

        script.onerror = () => {
            delete window[callbackName];
            script.remove();
            reject(new Error("Could not reach the quote service."));
        };

        script.src = `${QUOTE_API_URL}?callback=${callbackName}`;
        document.body.appendChild(script);
    });
}

function saveTodaysQuote(quote) {
    try {
        localStorage.setItem(todayKey(), JSON.stringify(quote));
    } catch (error) {
        console.error("Could not save today's quote in this browser.", error);
    }
}

async function loadDailyQuote() {
    try {
        const savedQuote = localStorage.getItem(todayKey());
        if (savedQuote) {
            const quote = JSON.parse(savedQuote);
            if (quote && typeof quote.quote === "string" && quote.quote.trim()) {
                displayQuote(quote);
                return;
            }
        }
    } catch (error) {
        console.error("Could not read today's saved quote.", error);
    }

    try {
        const quote = await fetchQuote();
        displayQuote(quote);
        saveTodaysQuote(quote);
    } catch (error) {
        console.error("Could not load a quote.", error);
        displayQuote(getDemoQuote());
        statusMessage.textContent = "The quote service could not be reached. Showing a demo quote.";
    }
}

newQuoteButton.addEventListener("click", async () => {
    newQuoteButton.disabled = true;

    try {
        const quote = await fetchQuote();
        displayQuote(quote);
        saveTodaysQuote(quote);
        statusMessage.textContent = "";
    } catch (error) {
        console.error("Could not fetch a new quote.", error);
        displayQuote(getDemoQuote());
        statusMessage.textContent = "The quote service could not be reached. Showing a demo quote.";
    } finally {
        newQuoteButton.disabled = false;
    }
});

loadDailyQuote();