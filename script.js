let expenseChart = null;
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let monthlyLimit = localStorage.getItem("monthlyLimit") || null;
let editingIndex = -1;

document.addEventListener("DOMContentLoaded", () => {
    initializeDate();
    initChart();
    updateUI();

    document.getElementById("expenseForm").addEventListener("submit", (e) => {
        e.preventDefault();

        const nameInput = document.getElementById("expenseName");
        const amountInput = document.getElementById("expenseAmount");
        const dateInput = document.getElementById("expenseDate");

        if (!nameInput.value.trim()) {
            Swal.fire("Error!", "Please enter an expense name!", "error");
            return;
        }

        if (!amountInput.value || Number(amountInput.value) <= 0) {
            Swal.fire("Error!", "Please enter a valid amount!", "error");
            return;
        }

        if (new Date(dateInput.value) > new Date()) {
            Swal.fire("Error!", "Future dates are not allowed!", "error");
            return;
        }

        const expense = {
            name: nameInput.value.trim(),
            amount: Number(amountInput.value).toFixed(2),
            date: dateInput.value,
        };

        if (editingIndex > -1) {
            expenses[editingIndex] = expense;
            Swal.fire("Success!", "Expense updated successfully!", "success");
        } else {
            expenses.push(expense);
            Swal.fire("Success!", "Expense added successfully!", "success");
        }

        saveData();
        cancelEdit();
    });
});

function initChart() {
    const ctx = document.getElementById("expenseChart").getContext("2d");
    if (expenseChart) expenseChart.destroy();

    const dates = [...new Set(expenses.map((e) => e.date))].sort();
    const dateSums = dates.map((date) =>
        expenses
            .filter((e) => e.date === date)
            .reduce((sum, e) => sum + Number(e.amount), 0)
    );

    expenseChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: dates,
            datasets: [
                {
                    label: "Daily Expenses (₹)",
                    data: dateSums,
                    backgroundColor: "rgba(99, 102, 241, 0.5)",
                    borderColor: "rgb(99, 102, 241)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => "₹" + value,
                    },
                },
            },
        },
    });
}

function initializeDate() {
    const dateInput = document.getElementById("expenseDate");
    dateInput.max = new Date().toISOString().split("T")[0];
    dateInput.value = new Date().toISOString().split("T")[0];
}

function saveData() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("monthlyLimit", monthlyLimit);
    updateUI();
}

function updateUI() {
    const list = document.getElementById("expensesList");
    list.innerHTML = expenses
        .map(
            (expense, index) => `
                <div class="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm mb-2">
                    <div class="flex-1">
                        <div class="font-medium text-gray-700">${expense.name}</div>
                        <div class="text-sm text-gray-500">${expense.date}</div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="font-semibold text-red-600">₹${expense.amount}</span>
                        <button onclick="editExpense(${index})" 
                                class="text-blue-500 hover:text-blue-700 transition-colors">
                            ✎
                        </button>
                        <button onclick="deleteExpense(${index})" 
                                class="text-red-500 hover:text-red-700 transition-colors">
                            ✕
                        </button>
                    </div>
                </div>
            `
        )
        .join("");

    const limitStatus = document.getElementById("limitStatus");
    if (monthlyLimit) {
        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const remaining = monthlyLimit - total;
        limitStatus.innerHTML = `
                    <div class="text-sm">
                        <span class="font-medium">Monthly Limit:</span> ₹${monthlyLimit}<br>
                        <span class="font-medium">Total Spent:</span> ₹${total.toFixed(
                            2
                        )}<br>
                        <span class="${
                            remaining < 0 ? "text-red-600" : "text-green-600"
                        } font-semibold">
                            Remaining: ₹${remaining.toFixed(2)}
                        </span>
                    </div>
                `;
    } else {
        limitStatus.innerHTML =
            '<div class="text-gray-500 text-sm">No monthly limit set</div>';
    }

    initChart();
}

function setLimit() {
    const limitInput = document.getElementById("limitInput");
    const limit = Number(limitInput.value);
    if (limit > 0) {
        monthlyLimit = limit;
        limitInput.value = "";
        saveData();
        Swal.fire("Success!", "Budget limit updated!", "success");
    } else {
        Swal.fire("Error!", "Please enter a valid amount!", "error");
    }
}

function editExpense(index) {
    editingIndex = index;
    const expense = expenses[index];
    document.getElementById("expenseName").value = expense.name;
    document.getElementById("expenseAmount").value = expense.amount;
    document.getElementById("expenseDate").value = expense.date;
    document.querySelector('#expenseForm button[type="submit"]').textContent =
        "Update Expense";
    document.getElementById("cancelEditBtn").classList.remove("hidden");
}

function cancelEdit() {
    editingIndex = -1;
    document.getElementById("expenseForm").reset();
    document.querySelector('#expenseForm button[type="submit"]').textContent =
        "Add Expense";
    document.getElementById("cancelEditBtn").classList.add("hidden");
    initializeDate();
}

function deleteExpense(index) {
    Swal.fire({
        title: "Delete Expense?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
    }).then((result) => {
        if (result.isConfirmed) {
            expenses.splice(index, 1);
            saveData();
            Swal.fire("Deleted!", "Expense removed successfully.", "success");
        }
    });
}

function resetAll() {
    Swal.fire({
        title: "Reset Everything?",
        text: "This will delete all expenses and budget limit!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, reset all!",
    }).then((result) => {
        if (result.isConfirmed) {
            expenses = [];
            monthlyLimit = null;
            localStorage.removeItem("expenses");
            localStorage.removeItem("monthlyLimit");
            updateUI();
            Swal.fire("Reset!", "All data has been cleared.", "success");
        }
    });
}

function exportExpenses() {
    if (expenses.length === 0) {
        Swal.fire("Oops!", "No expenses to export!", "error");
        return;
    }

    const csvContent = [
        ["Name", "Amount (₹)", "Date"].join(","),
        ...expenses.map(
            (e) => `"${e.name.replace(/"/g, '""')}",${e.amount},${e.date}`
        ),
    ].join("\n");

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
