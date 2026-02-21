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

    loadSavings();
});
const backToDashboard = document.querySelector(".dashboard");
backToDashboard.addEventListener("click", function () {
    window.location.href = "index.html";
})

function loadSavings() {

    const allSavings = user.savingsHistory || [];
    const allSavingDiv = document.querySelector(".all-savings");
    if (allSavings.length === 0) {
        const noSavings = document.createElement("p");
        noSavings.classList.add("no-savings");
        noSavings.innerText = "-No savings till now-";
        allSavingDiv.appendChild(noSavings);
    }
    [...allSavings].reverse().forEach(function (saving, index) {
        const currentSaving = document.createElement("div");
        currentSaving.classList.add("savings");
        currentSaving.dataset.id = saving.id;
        const dateTime = document.createElement("h5");
        dateTime.id = "date_time";
        dateTime.textContent = new Date(saving.date).toLocaleString();
        currentSaving.appendChild(dateTime);
        const section = document.createElement("section");
        section.classList.add("savings_details");
        const pInsideSection = document.createElement("p");
        pInsideSection.classList.add("savings_details_name");
        pInsideSection.innerText = saving.description;
        const amount = document.createElement("h6");
        amount.innerText = "₹" + saving.amount;
        section.appendChild(pInsideSection);
        section.appendChild(amount);
        currentSaving.appendChild(section);
        const deletebutton = document.createElement("i");
        deletebutton.classList.add("fa-solid");
        deletebutton.classList.add("fa-trash");
        deletebutton.classList.add("delete");
        currentSaving.appendChild(deletebutton);
        allSavingDiv.appendChild(currentSaving);
    })
    //delete
    const deleteButtons = document.querySelectorAll(".delete");
    const modal = document.querySelector(".delete_modal")
    deleteButtons.forEach(function (delbtn) {
        delbtn.addEventListener("click", function () {
            modal.style.display = "flex";
            const savingDiv = delbtn.parentElement;
            window.savingToDelete = savingDiv.dataset.id;

        })
    })
    const deleteYes = document.querySelector("#delete");
    const deleteNo = document.querySelector("#dont-delete");
    deleteNo.addEventListener("click", function () {
        modal.style.display = "none";
    })
    deleteYes.addEventListener("click", async function () {
        user.savingsHistory = user.savingsHistory.filter(s => s.id != window.savingToDelete);

        await db.collection("users").doc(uid).set(user, { merge: true });

        modal.style.display = "none";
        location.reload();
    });


    //SEARCH BAR
    const searchBar = document.querySelector("#search_savings");
    searchBar.addEventListener("input", function () {
        const text = searchBar.value.toLowerCase();
        const savingsDivs = document.querySelectorAll(".savings");
        savingsDivs.forEach(function (div, index) {
            const description = div.querySelector(".savings_details_name").innerText.toLowerCase();
            if (description.includes(text)) {
                div.style.display = "flex";
            }
            else {
                div.style.display = "none";
            }
        })
    })
}
