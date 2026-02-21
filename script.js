let lineGraphLabels = [];
let currentMode = "daily";

let user = null;
let uid = null;


firebase.auth().onAuthStateChanged(async (firebaseUser) => {
    if (!firebaseUser) {
        window.location.href = "login.html";
        return;
    }

    uid = firebaseUser.uid;

    const welcomeName = document.querySelector("#welcome_name");
    const username = firebaseUser.email.split("@")[0];
    welcomeName.textContent = "Hi! " + username;

    // get user document from Firestore
    const docRef = db.collection("users").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        // first time user → create profile
        user = {
            balance: 0,
            expenses: [],
            savingsHistory: [],
            budgetLimit: 0,
            notes: ""
        };
        await docRef.set(user);
    } else {
        user = docSnap.data();
    }

    startApp(); // continue loading rest of app
});
async function saveUserData() {
    if (!uid) return;
    await db.collection("users").doc(uid).set(user, { merge: true });
}
function startApp() {

    function hasSpendingExpenses() {
        for (let i = 0; i < user.expenses.length; i++) {
            if (user.expenses[i].type === "gave") {
                return true;
            }
        }
        return false;
    }



    if (!user.budgetLimit) {
        document.querySelector("#expenditure_limit").textContent = "Expenditure Limit : Not set";
    }



    let netBalance = user.balance;
    updateSavingsTotal();
    let balanceAmount = document.querySelector("#balance_amount");
    if (netBalance >= 0) {
        balanceAmount.textContent = "+₹" + netBalance;
        balanceAmount.dataset.color = "green"
    }
    if (netBalance < 0) {
        balanceAmount.textContent = "-₹" + Math.abs(netBalance);
        balanceAmount.dataset.color = "red";
    }


    //modal
    const addExpenseBtn = document.querySelector("#add_expense");
    const modal = document.querySelector("#expense_modal");
    const closeModal = document.querySelector("#close-modal");
    const modalStep1 = document.querySelector("#modal_step1");
    const modalGave = document.querySelector("#modal-you-gave");
    const modalGot = document.querySelector("#modal-you-got");

    function setDefaultDates() {
        const today = new Date().toISOString().split("T")[0];

        const gaveDate = document.querySelector("#gave_date");
        const gotDate = document.querySelector("#got_date");

        if (gaveDate) gaveDate.value = today;
        if (gotDate) gotDate.value = today;
    }

    addExpenseBtn.addEventListener("click", function () {
        modal.style.display = "flex";
        setDefaultDates();
    })
    closeModal.addEventListener("click", function () {
        modal.style.display = "none";
        resetModal();
    })
    window.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.style.display = "none";
            resetModal();
        }
    })
    function resetModal() {
        modalStep1.style.display = "block";
        modalGave.style.display = "none";
        modalGot.style.display = "none";
    }
    document.querySelector("#yougave-button").addEventListener("click", function () {
        modalStep1.style.display = "none";
        modalGave.style.display = "flex";
    })
    document.querySelector("#yougot-button").addEventListener("click", function () {
        modalStep1.style.display = "none";
        modalGot.style.display = "flex";
    })
    document.querySelector("#save_gave").addEventListener("click", function () {

        let category = document.querySelector("#gave_category").value;
        let amount = Number(document.querySelector("#gave_amount").value);
        let description = document.querySelector("#gave_description").value;
        if (category === "") {
            alert("Please select a category");
            return;
        }
        if (!amount) {
            alert("Enter valid amount");
            return;
        }
        const selectedDate = document.querySelector("#gave_date").value;
        let finalDate;
        if (selectedDate) {
            const now = new Date();
            finalDate = new Date(
                selectedDate + "T" +
                now.toTimeString().split(" ")[0]
            ).toISOString();
        } else {
            finalDate = new Date().toISOString();
        }
        user.expenses.push({
            id: Date.now(),
            type: "gave",
            categories: category,
            amounts: amount,
            descriptions: description,
            date: finalDate,

        })
        drawLineGraph();
        user.balance -= amount;
        document.querySelector("#gave_category").value = "";
        document.querySelector("#gave_amount").value = "";
        document.querySelector("#gave_description").value = "";
        saveUserData();
        updateBalanceUI();
        updateLimitUI();
        displayRecentFour();
        updateInsights();
        modal.style.display = "none";
        resetModal();
    })


    document.querySelector("#save_got").addEventListener("click", () => {
        let amount = Number(document.querySelector("#got_amount").value);
        let description = document.querySelector("#got_description").value;

        if (!amount) {
            alert("Enter valid amount");
            return;
        }
        const selectedDate = document.querySelector("#got_date").value;
        let finalDate;
        if (selectedDate) {
            const now = new Date();
            finalDate = new Date(
                selectedDate + "T" +
                now.toTimeString().split(" ")[0]
            ).toISOString();
        } else {
            finalDate = new Date().toISOString();
        }
        user.expenses.push({
            id: Date.now(),
            type: "got",
            amounts: amount,
            descriptions: description,
            date: finalDate,
        });
        drawLineGraph();


        user.balance += amount;
        document.querySelector("#got_amount").value = "";
        document.querySelector("#got_description").value = "";

        saveUserData();
        updateBalanceUI();
        updateLimitUI();
        displayRecentFour();
        updateInsights();
        modal.style.display = "none";
        resetModal();
    });
    document.querySelector("#save_got_reflect").addEventListener("click", () => {
        let amount = Number(document.querySelector("#got_amount").value);
        let description = document.querySelector("#got_description").value;
        const selectedDate = document.querySelector("#got_date").value;

        if (!amount) {
            alert("Enter valid amount");
            return;
        }
        let finalDate;
        if (selectedDate) {
            const now = new Date();
            finalDate = new Date(
                selectedDate + "T" +
                now.toTimeString().split(" ")[0]
            ).toISOString();
        } else {
            finalDate = new Date().toISOString();
        }
        user.expenses.push({
            id: Date.now(),
            type: "got_extra",
            amounts: amount,
            descriptions: description,
            date: finalDate,
        });
        drawLineGraph();


        user.balance += amount;
        document.querySelector("#got_amount").value = "";
        document.querySelector("#got_description").value = "";

        saveUserData();
        updateBalanceUI();
        updateLimitUI();
        displayRecentFour();
        updateInsights();
        modal.style.display = "none";
        resetModal();
    });
    function updateBalanceUI() {
        let balanceAmount = document.querySelector("#balance_amount");

        if (user.balance >= 0) {
            balanceAmount.textContent = "+₹" + user.balance;
            balanceAmount.dataset.color = "green";
        } else {
            balanceAmount.textContent = "-₹" + Math.abs(user.balance);
            balanceAmount.dataset.color = "red";
        }
    }





    //LIMIT CONTROL MODAL
    const setExpenditureText = document.querySelector("#set_expenditure_limit");
    const limitModal = document.querySelector(".limit_modal");
    const closeLimitModal = document.querySelector("#close-modal-limit");
    const limitSaveBtn = document.querySelector("#save_limit");
    setExpenditureText.addEventListener("click", function () {
        limitModal.style.display = "flex";
    })
    closeLimitModal.addEventListener("click", function () {
        limitModal.style.display = "none";

    })
    window.addEventListener("click", function (e) {
        if (e.target === limitModal) {
            limitModal.style.display = "none";

        }
    })
    limitSaveBtn.addEventListener("click", function () {
        if (document.querySelector("#limit_amount").value == "" || document.querySelector("#limit_start_date").value == "") {
            alert("Fill all the fields!");
        }
        else {
            const expenditureLimit = document.querySelector("#limit_amount").value;
            document.querySelector("#expenditure_limit").textContent = `Expenditure Limit : ₹${expenditureLimit}`;
            user.budgetLimit = Number(expenditureLimit);
            const startDate = document.querySelector("#limit_start_date").value;
            user.budgetStartDate = startDate;
            saveUserData();
            limitModal.style.display = "none";
            updateLimitUI();
            updateInsights();

        }
    })
    function calculateSpentSinceStart() {
        if (!user || !user.budgetStartDate) return 0;

        const start = new Date(user.budgetStartDate + "T00:00:00");
        if (isNaN(start)) return 0;

        let total = 0;

        user.expenses.forEach(exp => {
            const expDate = new Date(exp.date);
            if (isNaN(expDate)) return;

            if (expDate >= start) {
                if (exp.type === "gave") total += exp.amounts;
                if (exp.type === "got_extra") total -= exp.amounts;
            }
        });

        return total;
    }

    function updateLimitUI() {
        if (!user) return;

        const spent = calculateSpentSinceStart();
        const limit = user.budgetLimit || 0;
        const left = limit - spent;

        document.querySelector("#spent").textContent = `Spent : ₹${spent}`;
        document.querySelector("#left").textContent = `Left : ₹${left}`;

        if (limit > 0) {
            document.querySelector("#expenditure_limit").textContent = `Expenditure Limit : ₹${limit}`;
        } else {
            document.querySelector("#expenditure_limit").textContent = `Expenditure Limit : Not set`;
        }

        let percentage = 0;
        if (limit > 0) {
            percentage = Math.min((spent / limit) * 100, 100);
        }

        document.querySelector("#percentage_used").textContent = `${percentage.toFixed(0)}%`;

        const bar = document.querySelector(".limit_bar_fill");
        bar.style.width = percentage + "%";
        bar.style.background = spent > limit ? "red" : "limegreen";
    }
    const clearDataText = document.querySelector("#remove_limit");
    clearDataText.addEventListener("click", async function () {
        user.budgetLimit = 0;
        user.budgetStartDate = null;

        await saveUserData();   // saves to Firestore

        document.querySelector("#percentage_used").textContent = "0%";
        document.querySelector("#expenditure_limit").textContent = `Expenditure Limit : Not set`;
        document.querySelector("#spent").textContent = "Spent : ₹0";
        document.querySelector("#left").textContent = "Left : ₹0";

        const bar = document.querySelector(".limit_bar_fill");
        bar.style.width = "0%";
    });

    //Recent-expenses
    function displayRecentFour() {
        const allExpenses = user.expenses;
        allExpenseDiv.innerHTML = "";
        const sorted = [...allExpenses].sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });
        const recentFour = sorted.slice(0, 4);
        recentFour.forEach(function (expense) {
            const currentExpense = document.createElement("div");
            currentExpense.classList.add("expense");
            const type = expense.type;
            if (type === "got" || type === "got_extra") {
                currentExpense.dataset.color = "green";
            }
            else if (type == "gave") {
                currentExpense.dataset.color = "red";
            }
            currentExpense.appendChild(document.createElement("header"));
            const dateTime = document.createElement("h5");
            dateTime.id = "date_time";
            dateTime.textContent = new Date(expense.date).toLocaleString();
            currentExpense.appendChild(dateTime);
            const section = document.createElement("section");
            section.classList.add("expense_details");
            const divInsideSection = document.createElement("div");
            divInsideSection.classList.add("expense_details_name");
            const pInsideDiv = document.createElement("p");
            pInsideDiv.innerText = expense.descriptions;
            const spanInsideDiv = document.createElement("span");
            spanInsideDiv.innerText = expense.categories ? `(${expense.categories})` : "";
            divInsideSection.appendChild(pInsideDiv);
            divInsideSection.appendChild(spanInsideDiv);
            const amount = document.createElement("h6");
            amount.innerText = "₹" + expense.amounts;
            section.appendChild(divInsideSection);
            section.appendChild(amount);
            currentExpense.appendChild(section);
            allExpenseDiv.appendChild(currentExpense);
        });


    }

    const allExpenseDiv = document.querySelector(".all-expenses");
    if (user.expenses.length === 0) {
        const noExpense = document.createElement("p");
        noExpense.classList.add("no-expense");
        noExpense.innerText = "-No expenses added till now-"
        allExpenseDiv.appendChild(noExpense);
    }
    else {
        displayRecentFour();
    };
    document.querySelector("#show_all").addEventListener("click", function () {
        window.location.href = "expense.html";
    })
    updateLimitUI();


    const pencilIcon = document.querySelector(".pencil");
    const notesModal = document.querySelector("#notes_modal");
    const closeNotesModal = document.querySelector("#close_notes_modal");
    const notesTextarea = document.querySelector("#notes_textarea");

    pencilIcon.addEventListener("click", function () {
        if (user.notes) {
            notesTextarea.value = user.notes;
        } else {
            notesTextarea.value = "";
        }

        notesModal.style.display = "flex";
    });

    closeNotesModal.addEventListener("click", function () {
        notesModal.style.display = "none";
    });

    window.addEventListener("click", function (e) {
        if (e.target === notesModal) {
            notesModal.style.display = "none";
        }
    });
    document.querySelector("#save_notes_btn").addEventListener("click", async function () {
        const writtenNotes = notesTextarea.value.trim();
        user.notes = writtenNotes;

        await saveUserData();   // saves to Firebase

        notesModal.style.display = "none";
    });


    const savingsBox = document.querySelector("#savings_modal");
    document.querySelector("#savings").addEventListener("click", function () {
        savingsBox.style.display = "flex";
    });

    window.addEventListener("click", function (e) {
        if (e.target === savingsBox) {
            savingsBox.style.display = "none";
        }
    });
    document.querySelector("#save_savings_btn").addEventListener("click", async function () {

        let amount = Number(document.querySelector("#savings_input").value);
        let description = document.querySelector("#savings_description").value;

        if (!amount || amount <= 0) {
            alert("Enter a valid savings amount");
            return;
        }
        if (!description) {
            alert("Write some description");
            return;
        }

        user.savingsHistory.push({
            id: Date.now(),
            amount: amount,
            date: new Date().toISOString(),
            description: description,
        });

        await saveUserData();

        updateInsights();
        updateSavingsTotal();
        dropCoin();

        document.querySelector("#savings_input").value = "";
        document.querySelector("#savings_description").value = "";
        savingsBox.style.display = "none";
    });
    function updateSavingsTotal() {
        let total = 0;
        user.savingsHistory.forEach(entry => {
            total += entry.amount;
        });
        user.savedAmount = total;
        document.querySelector("#savings_total").textContent = "Saved: ₹" + total;
    }
    function dropCoin() {
        const container = document.getElementById("coin_container");
        const coin = document.createElement("div");
        coin.classList.add("coin");

        container.appendChild(coin);

        let randomX = Math.random() * 100;

        setTimeout(() => {
            coin.style.top = (60 + Math.random() * 15) + "px";
            coin.style.left = randomX + "px";
        }, 50);
    }
    function loadCoins() {
        const count = user.savingsHistory.length;
        for (let i = 0; i < count; i++) {
            setTimeout(() => dropCoin(), i * 80);
        }
    }

    loadCoins();

    const showAllBtn = document.querySelector(".show_all_savings");
    showAllBtn.addEventListener("click", function () {
        window.location.href = "savings.html";
    })


    function getDailyData() {
        const map = {};

        user.expenses.forEach(exp => {
            if (exp.type !== "gave") return;
            const date = new Date(exp.date).toLocaleDateString("en-CA");
            map[date] = (map[date] || 0) + exp.amounts;
        });

        return map;
    }

    function getMonthlyData() {
        const map = {};

        user.expenses.forEach(exp => {
            if (exp.type !== "gave") return;
            const d = new Date(exp.date);
            const key = d.toLocaleString("en-US", {
                month: "short",
                year: "numeric"
            });

            map[key] = (map[key] || 0) + exp.amounts;
        });

        return map;
    }

    function setupCanvas(canvas, ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);
    }

    function drawLineGraph() {
        const canvas = document.getElementById("lineChart");
        const graphContainer = document.querySelector(".section2_2");


        if (!hasSpendingExpenses()) {
            canvas.style.display = "none";
            graphContainer.classList.add("compact");
            if (!graphContainer.querySelector(".no-expense")) {
                graphContainer.innerHTML += `
                <p class="no-expense">
                    -Add expenses to track your spending-
                </p>
            `;
            }
            return;
        }
        canvas.style.display = "block";
        graphContainer.classList.remove("compact");
        if (graphContainer.querySelector(".no-expense")) {
            graphContainer.removeChild(graphContainer.querySelector(".no-expense"));
        };


        const ctx = canvas.getContext("2d");
        setupCanvas(canvas, ctx);

        const dataMap = currentMode === "daily"
            ? getDailyData()
            : getMonthlyData();

        const sortedEntries = Object.entries(dataMap).sort((a, b) => {
            return new Date(a[0]) - new Date(b[0]);
        });

        lineGraphLabels = sortedEntries.map(e => e[0]);
        const values = sortedEntries.map(e => e[1]);

        if (values.length === 0) return;

        const padding = 45;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const maxValue = Math.max(...values);

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = "#aaa";
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, h - padding);
        ctx.lineTo(w - padding, h - padding);
        ctx.stroke();

        const steps = 5;
        ctx.fillStyle = "#ccc";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "right";

        for (let i = 0; i <= steps; i++) {
            const value = Math.round((maxValue / steps) * i);
            const y =
                h - padding - (i / steps) * (h - padding * 2);

            ctx.fillText(`₹${value}`, padding - 8, y + 4);

            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.stroke();
        }

        ctx.strokeStyle = "#4bc0c0";
        ctx.lineWidth = 2;
        ctx.beginPath();

        let lineGraphPoints = [];

        if (values.length === 1) {
            const x = w / 2;
            const y = h - padding - (values[0] / maxValue) * (h - padding * 2);

            ctx.strokeStyle = "#4bc0c0";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#4bc0c0";
            ctx.fill();

            ctx.fillStyle = "#ccc";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(lineGraphLabels[0], x, h - 15);

            return;
        }

        values.forEach((value, i) => {
            const x = padding + (i / (values.length - 1)) * (w - padding * 2);
            const y =
                h - padding -
                (value / maxValue) * (h - padding * 2);

            lineGraphPoints.push({ x, y, value, label: lineGraphLabels[i] });

            if (i === 0) {
                ctx.moveTo(x, y);
            }
            else {
                ctx.lineTo(x, y);
            }

        });

        const last = lineGraphPoints[lineGraphPoints.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();

        ctx.fillStyle = "#4bc0c0";
        lineGraphPoints.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = "#ccc";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";

        const graphWidth = canvas.clientWidth;
        const maxLabels = Math.floor(graphWidth / 80)
        const safeMaxLabels = Math.max(maxLabels, 2);
        const step = Math.ceil(lineGraphLabels.length / safeMaxLabels);

        lineGraphLabels.forEach((label, i) => {
            if (i % step !== 0 && i !== lineGraphLabels.length - 1) return;

            const x = padding + (i / (lineGraphLabels.length - 1)) * (w - padding * 2);

            let displayLabel = label;
            if (currentMode === "daily") {
                const d = new Date(label);
                displayLabel = d.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short"
                });
            }

            ctx.fillText(displayLabel, x, h - 15);
        });


    }

    const toggleBtn = document.getElementById("toggle_btn");
    const showDaily = document.getElementById("show_daily");
    const showMonthly = document.getElementById("show_monthly");

    currentMode = "daily";
    showDaily.style.display = "block";
    showMonthly.style.display = "none";
    drawLineGraph();

    toggleBtn.addEventListener("click", function () {

        if (currentMode === "daily") {
            currentMode = "monthly";
            showDaily.style.display = "none";
            showMonthly.style.display = "block";
        } else {
            currentMode = "daily";
            showMonthly.style.display = "none";
            showDaily.style.display = "block";
        }

        drawLineGraph();
    });



    drawLineGraph();
    function getOrdinal(n) {
        n = Number(n);

        if (n % 100 >= 11 && n % 100 <= 13) return n + "th";

        switch (n % 10) {
            case 1: return n + "st";
            case 2: return n + "nd";
            case 3: return n + "rd";
            default: return n + "th";
        }
    }

    function updateInsights() {
        let list = document.getElementById("insight1");
        if (user.expenses.length == 0) {
            list.innerHTML = `<li class="no-expense">-Add expenses to see insight-</li>`;

            return;
        }

        let now = new Date();
        let month = now.getMonth();
        let year = now.getFullYear();

        let dailySpend = {};
        let categorySpend = {};

        user.expenses.forEach(function (exp) {

            if (exp.type !== "gave") return;

            let d = new Date(exp.date);

            if (d.getMonth() !== month || d.getFullYear() !== year) {
                return;
            }

            let day = d.getDate();

            if (dailySpend[day]) {
                dailySpend[day] += exp.amounts;
            } else {
                dailySpend[day] = exp.amounts;
            }

            if (categorySpend[exp.categories]) {
                categorySpend[exp.categories] += exp.amounts;
            } else {
                categorySpend[exp.categories] = exp.amounts;
            }
        });

        let highestDay = "";
        let highestAmount = 0;

        for (let d in dailySpend) {
            if (dailySpend[d] > highestAmount) {
                highestAmount = dailySpend[d];
                highestDay = d;
            }
        }
        let topCategory = "";
        let topCategoryAmount = 0;

        for (let c in categorySpend) {
            if (categorySpend[c] > topCategoryAmount) {
                topCategoryAmount = categorySpend[c];
                topCategory = c;
            }
        }

        let total = 0;
        let daysCount = 0;

        for (let d in dailySpend) {
            total += dailySpend[d];
            daysCount++;
        }

        let avgDaily = daysCount ? Math.round(total / daysCount) : 0;
        let trackingStart;
        if (user.trackingStartDate) {
            trackingStart = new Date(user.trackingStartDate);
        }
        else if (user.expenses.length > 0) {
            trackingStart = new Date(
                Math.min(...user.expenses.map(e => new Date(e.date)))
            );
        }
        else {
            trackingStart = null;
        }
        let noExpenseDays = 0;
        if (trackingStart) {
            const nowDate = new Date();
            const totalDaysTracked =
                Math.floor((nowDate - trackingStart) / (1000 * 60 * 60 * 24)) + 1;

            noExpenseDays = Math.max(totalDaysTracked - daysCount, 0);
        }
        let totalSaved = 0;
        user.savingsHistory.forEach(function (saving) {
            var d = new Date(saving.date);
            if (d.getMonth() != month || d.getFullYear() != year) {
                return;
            }
            else {
                totalSaved += saving.amount;
            }
        })

        list.innerHTML =
            "<li><span>Highest spending day:</span> ₹" + highestAmount + " on " + getOrdinal(highestDay) + "</li>" +
            "<li><span>Top category:</span> " + topCategory + " (₹" + topCategoryAmount + ")</li>" +
            "<li><span>Avg daily spend:</span> ₹" + avgDaily + "</li>" +
            "<li>" + noExpenseDays + " <span>days with no expenses</span></li>" +
            "<li><span>Total saved this month: </span> ₹" + totalSaved + "</li>"
            ;
        const insight2 = document.querySelector("#insight2");
        let daysInMonth = new Date(year, month + 1, 0).getDate();
        let aboveLimit = false;
        if (avgDaily * daysInMonth > user.budgetLimit) {
            aboveLimit = true;
        }
        if (aboveLimit) {
            insight2.innerHTML =
                "<p>At current rate, you may spend ₹" + avgDaily * daysInMonth + " this month</p>" +
                "<p>⚠️ You are likely to exceed your limit</p>"
                ;
        }
        else {
            insight2.innerHTML =
                "<p>At current rate, you may spend ₹" + avgDaily * daysInMonth + " this month</p>" +
                "<p>You are unlikely to exceed your limit</p>"
                ;
        }



    }

    updateInsights();

    const threeLines = document.querySelector("#three_lines");
    const sidebar = document.querySelector(".side_bar");

    if (threeLines && sidebar) {
        threeLines.addEventListener("click", function () {
            sidebar.classList.toggle("active");
        });
    }

    document.querySelector("#expense_modal").addEventListener("keydown", function (e) {
        if (e.key !== "Enter") {
            return;
        }
        e.preventDefault();
        if (modalGave.style.display === "flex") {
            document.querySelector("#save_gave").click();
        }
        else if (modalGot.style.display === "flex") {
            document.querySelector("#save_got").click();
        }

    });
    document.querySelector(".limit_modal").addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;

        e.preventDefault();
        document.querySelector("#save_limit").click();
    });

    document.querySelector("#savings_modal").addEventListener("keydown", function (e) {
        if (e.key !== "Enter") {
            return;
        }
        e.preventDefault();
        if (savingsBox.style.display === "flex") {
            document.querySelector("#save_savings_btn").click();
        }


    });


    const infoIcon = document.querySelector("#info_icon");
    const infoModal = document.querySelector("#info_modal");
    const closeInfo = document.querySelector("#close_info");

    infoIcon.addEventListener("click", function () {
        infoModal.style.display = "flex";
    });

    closeInfo.addEventListener("click", function () {
        infoModal.style.display = "none";
    });

    window.addEventListener("click", function (e) {
        if (e.target === infoModal) {
            infoModal.style.display = "none";
        }
    });

}
document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.querySelector("#logout");

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            console.log("Logging out...");
            await firebase.auth().signOut();
        });
    }
});
