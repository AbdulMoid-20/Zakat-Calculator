const TWELVE_HOURS = 12 * 60 * 60 * 1000;

let goldRatePKR = 0;
let silverRatePKR = 0;
let zakatAmount = 0;
let netWorth = 0;

/* ================= MODAL ================= */

function showModal(title, message) {
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalMessage").innerText = message;
    document.getElementById("customModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("customModal").style.display = "none";
}


function hasAnyInput() {
    const fields = ["goldWeight", "silverWeight", "cash", "bank", "business", "liabilities"];
    return fields.some(id => {
        const val = document.getElementById(id).value;
        return val !== "" && parseFloat(val) > 0;
    });
}

// RATE HANDLING LOGIC

function loadRates() {
    const savedRates = JSON.parse(localStorage.getItem("metalRates"));

    if (savedRates && Date.now() - savedRates.timestamp < TWELVE_HOURS) {
        goldRatePKR = savedRates.gold;
        silverRatePKR = savedRates.silver;
        updateRateUI("Cached");
    } else {
        fetchRatesFromAPI();
    }
}

// FETCH API 

async function fetchRatesFromAPI() {
    try {
        const metalRes = await fetch(
            "https://api.allorigins.win/raw?url=https://data-asg.goldprice.org/dbXRates/USD"
        );
        const metalData = await metalRes.json();

        const rateRes = await fetch(
            "https://api.allorigins.win/raw?url=https://open.er-api.com/v6/latest/USD"
        );
        const rateData = await rateRes.json();

        const usdToPKR = rateData.rates.PKR;

        goldRatePKR = (metalData.items[0].xauPrice / 31.1035) * usdToPKR;
        silverRatePKR = (metalData.items[0].xagPrice / 31.1035) * usdToPKR;

        localStorage.setItem("metalRates", JSON.stringify({
            gold: goldRatePKR,
            silver: silverRatePKR,
            timestamp: Date.now()
        }));

        updateRateUI("Live");

    } catch (error) {
        useFallbackRates();
        showModal("Rate Warning", "Live rates unavailable. Using estimated values.");
    }
}

function useFallbackRates() {
    goldRatePKR = 21000;
    silverRatePKR = 250;
    updateRateUI("Estimated");
}

function updateRateUI(source) {
    document.getElementById("liveRates").innerHTML =
        `Gold: PKR ${goldRatePKR.toFixed(0)}/g | 
         Silver: PKR ${silverRatePKR.toFixed(0)}/g
         <br><small>Source: ${source} • Auto refresh every 12 hours</small>`;
}

// CALCULATION LOGIC  

function calculateZakat() {

    if (!hasAnyInput()) {
        showModal("Missing Information", "Please enter asset values before calculating.");
        return;
    }

    if (goldRatePKR === 0 || silverRatePKR === 0) {
        showModal("Loading", "Rates are still loading. Please wait.");
        return;
    }

    const goldWeight = parseFloat(document.getElementById("goldWeight").value) || 0;
    const silverWeight = parseFloat(document.getElementById("silverWeight").value) || 0;
    const cash = parseFloat(document.getElementById("cash").value) || 0;
    const bank = parseFloat(document.getElementById("bank").value) || 0;
    const business = parseFloat(document.getElementById("business").value) || 0;
    const liabilities = parseFloat(document.getElementById("liabilities").value) || 0;

    const goldValue = goldWeight * goldRatePKR;
    const silverValue = silverWeight * silverRatePKR;

    const totalAssets = goldValue + silverValue + cash + bank + business;
    netWorth = totalAssets - liabilities;

    if (netWorth <= 0) {
        showModal("No Zakat Due", "Your net wealth is zero or negative.");
        return;
    }

    const nisabSilver = 612.36 * silverRatePKR;
    const nisabBox = document.getElementById("nisabInfo");

    if (netWorth >= nisabSilver) {
        zakatAmount = netWorth * 0.025;
        nisabBox.innerHTML = "You are ABOVE Nisab. Zakat is obligatory.";
        nisabBox.className = "nisab-box above-nisab";
        document.getElementById("result").innerHTML =
            `Total Zakat Payable: PKR ${zakatAmount.toFixed(2)}`;
    } else {
        zakatAmount = 0;
        nisabBox.innerHTML = "You are BELOW Nisab. Zakat is not obligatory.";
        nisabBox.className = "nisab-box below-nisab";
        document.getElementById("result").innerHTML = "No Zakat Due.";
    }
}

// PDF GENERATION

function generatePDF() {

    if (!hasAnyInput()) {
        showModal("Missing Data", "Please enter values and calculate first.");
        return;
    }

    if (zakatAmount <= 0) {
        showModal("Calculate First", "Please calculate Zakat before downloading.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let date = new Date().toLocaleString();

    doc.setFillColor(5, 46, 38);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 215, 110);
    doc.setFontSize(18);
    doc.text("Ramadan Zakat Receipt", 60, 20);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    doc.text("Date: " + date, 20, 50);
    doc.text("Net Worth: PKR " + netWorth.toFixed(2), 20, 65);
    doc.text("Zakat (2.5%): PKR " + zakatAmount.toFixed(2), 20, 80);

    doc.text("May Allah accept your Zakat and grant Barakah.", 20, 110);

    doc.save("Ramadan_Zakat_Receipt.pdf");

    showModal("Success", "Receipt downloaded successfully.");
}

// SAVE HISTORY 

function saveHistory() {

    if (!hasAnyInput()) {
        showModal("Missing Data", "Please enter values and calculate first.");
        return;
    }

    if (zakatAmount <= 0) {
        showModal("Calculate First", "Please calculate before saving.");
        return;
    }

    let history = JSON.parse(localStorage.getItem("zakatHistory")) || [];

    history.push({
        date: new Date().toLocaleString(),
        netWorth: netWorth,
        zakat: zakatAmount
    });

    localStorage.setItem("zakatHistory", JSON.stringify(history));

    displayHistory();
    showModal("Saved", "Calculation saved successfully.");
}

function displayHistory() {
    let history = JSON.parse(localStorage.getItem("zakatHistory")) || [];
    let output = "";

    history.forEach(item => {
        output += `
        <div class="history-item">
            <strong>${item.date}</strong><br>
            Net Worth: PKR ${item.netWorth.toFixed(2)}<br>
            Zakat: PKR ${item.zakat.toFixed(2)}
        </div>`;
    });

    document.getElementById("history").innerHTML = output;
}



loadRates();
displayHistory();
