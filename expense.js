let user = null;
let uid = null;

auth.onAuthStateChanged(async (firebaseUser) => {
    if (!firebaseUser) {
        window.location.href = "login.html";
        return;
    }

    uid = firebaseUser.uid;

    const doc = await db.collection("users").doc(uid).get();
    user = doc.data();

    loadExpenses();
});
function loadExpenses() {
    const allExpenses = user.expenses || [];

    const allExpenseDiv = document.querySelector(".all-expenses");
    if (allExpenses.length === 0) {
        const noExpense = document.createElement("p");
        noExpense.classList.add("no-expense");
        noExpense.innerText = "-No expenses added till now-"
        allExpenseDiv.appendChild(noExpense);
    }
    [...allExpenses].reverse().forEach(function (expense) {
        const currentExpense = document.createElement("div");
        currentExpense.dataset.category = expense.categories ? expense.categories.toLowerCase() : "none";

        currentExpense.classList.add("expense");
        const type = expense.type;
        if (type === "got" || type === "got_extra") {
            currentExpense.dataset.color = "green";
        }
        else if (type == "gave") {
            currentExpense.dataset.color = "red";
        }
        currentExpense.dataset.id = expense.id;
        currentExpense.dataset.date = new Date(expense.date).toLocaleDateString("en-CA");

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
        const deletebutton = document.createElement("i");
        deletebutton.classList.add("fa-solid");
        deletebutton.classList.add("fa-trash");
        deletebutton.classList.add("delete");
        currentExpense.appendChild(deletebutton);
        allExpenseDiv.appendChild(currentExpense);
    })
    //delete
    const deleteButtons = document.querySelectorAll(".delete");
    const modal = document.querySelector(".delete_modal")
    deleteButtons.forEach(function (delbtn) {
        delbtn.addEventListener("click", function () {
            modal.style.display = "flex";
            const expenseDiv = delbtn.parentElement;
            window.expenseToDelete = expenseDiv.dataset.id;

        })
    })
    const deleteYes = document.querySelector("#delete");
    const deleteNo = document.querySelector("#dont-delete");
    deleteNo.addEventListener("click", function () {
        modal.style.display = "none";
    })
    deleteYes.addEventListener("click", async function () {
        const index = user.expenses.findIndex(
            exp => exp.id == window.expenseToDelete
        );

        if (index === -1) {
            modal.style.display = "none";
            return;
        }

        const deletedExpense = user.expenses[index];

        if (deletedExpense.type === "gave") {
            user.balance += deletedExpense.amounts;
        }
        if (deletedExpense.type === "got" || deletedExpense.type === "got_extra") {
            user.balance -= deletedExpense.amounts;
        }

        user.expenses.splice(index, 1);

        await db.collection("users").doc(uid).set(user, { merge: true });

        modal.style.display = "none";
        location.reload();
    });


    const backToDashboard = document.querySelector(".dashboard");
    backToDashboard.addEventListener("click", function () {
        window.location.href = "index.html";
    })

    //SEARCH BAR
    const searchBar = document.querySelector("#search_expense");
    searchBar.addEventListener("input", function () {
        const text = searchBar.value.toLowerCase();
        const expenseDivs = document.querySelectorAll(".expense");

        expenseDivs.forEach(function (div) {
            const description = div.querySelector(".expense_details_name p").innerText.toLowerCase();

            div.style.display = description.includes(text) ? "flex" : "none";
        });
    });


    //FILTER
    const filterSelect = document.querySelector(".all-filters");

    filterSelect.addEventListener("change", function () {
        const selectedCategory = filterSelect.value.toLowerCase();
        const allExpenseDivs = document.querySelectorAll(".expense");
        allExpenseDivs.forEach(div => {
            div.style.display = "flex";
        });
        if (selectedCategory === "all") return;
        allExpenseDivs.forEach(expenseDiv => {
            if (expenseDiv.dataset.category !== selectedCategory) {
                expenseDiv.style.display = "none";
            }
        });
        const refreshDiv = document.querySelector('.refresh_div');

        if (!refreshDiv.querySelector('.refresh')) {
            const refreshP = document.createElement('p');
            refreshP.classList.add('refresh');
            refreshP.innerHTML = "(Refresh to remove filters)";
            refreshDiv.appendChild(refreshP);
        }


    });


    const selectCalendar = document.querySelector(".calendar");
    const org_calendar = document.querySelector("#search_date");
    selectCalendar.addEventListener("click", function () {
        org_calendar.showPicker();
        org_calendar.addEventListener("change", function () {
            const selectedDate = org_calendar.value;
            const expenseDivs = document.querySelectorAll(".expense");

            expenseDivs.forEach(div => {
                const expenseDate = div.dataset.date;

                if (expenseDate === selectedDate) {
                    div.style.display = "flex";
                } else {
                    div.style.display = "none";
                }
            });

            const refreshDiv = document.querySelector('.refresh_div');

            if (!refreshDiv.querySelector('.refresh')) {
                const refreshP = document.createElement('p');
                refreshP.classList.add('refresh');
                refreshP.innerHTML = "(Refresh to remove filters)";
                refreshDiv.appendChild(refreshP);
            }


        });



    })
}

