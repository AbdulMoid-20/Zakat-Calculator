let zakatAmount = 0;
let netWorth = 0;

function calculateZakat() {

    let gold = parseFloat(document.getElementById("gold").value) || 0;
    let cash = parseFloat(document.getElementById("cash").value) || 0;
    let bank = parseFloat(document.getElementById("bank").value) || 0;
    let business = parseFloat(document.getElementById("business").value) || 0;
    let liabilities = parseFloat(document.getElementById("liabilities").value) || 0;

    let totalAssets = gold + cash + bank + business;

    netWorth = totalAssets - liabilities;
    zakatAmount = netWorth * 0.025;

    document.getElementById("result").innerHTML =
        "Total Zakat Payable: PKR " + zakatAmount.toFixed(2);
}

/* ===== PDF RECEIPT ===== */

function generatePDF() {

    if (zakatAmount <= 0) {
        alert("Please calculate Zakat first.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let date = new Date().toLocaleString();

    doc.setFontSize(18);
    doc.text("Zakat Payment Receipt", 20, 20);

    doc.setFontSize(12);
    doc.text("Date: " + date, 20, 35);
    doc.text("Net Worth: PKR " + netWorth.toFixed(2), 20, 45);
    doc.text("Zakat (2.5%): PKR " + zakatAmount.toFixed(2), 20, 55);

    doc.text("May Allah accept your Zakat.", 20, 75);

    doc.save("Zakat_Receipt.pdf");
}

/* ===== SAVE HISTORY ===== */

function saveHistory() {

    if (zakatAmount <= 0) {
        alert("Calculate first before saving.");
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
}

function displayHistory() {

    let history = JSON.parse(localStorage.getItem("zakatHistory")) || [];

    let output = "";

    history.forEach(item => {
        output += `
      <div>
        <strong>${item.date}</strong><br>
        Net Worth: PKR ${item.netWorth.toFixed(2)}<br>
        Zakat: PKR ${item.zakat.toFixed(2)}
      </div>
    `;
    });

    document.getElementById("history").innerHTML = output;
}

displayHistory();