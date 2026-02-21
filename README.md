# CashXcel-Expense-Tracker

CashXcel is a personal expense tracker built using HTML, CSS, and Vanilla JavaScript.
It helps users manage their expenses, income, savings, and monthly budget in a simple,
interactive, and visual way using browser LocalStorage.

# Problem statement
Being a college student I have seen myself and other students always struggling with money,
not knowing where their money has disappeared by the end of the month

CashXcel solves this problem by providing an easy-to-use web interface to:
- Track expenses and income
- Monitor savings
- Set and manage spending limits
- Visualize spending patterns

# Features Implemented

- User signup and login (LocalStorage based)
- Add expenses
- Add income
- Net balance calculation
- Monthly expenditure limit control
- Savings wallet with coin animation
- Expense and savings history
- Delete expenses and savings
- Search and filter expenses
- Daily and monthly spending graph
- Insights section showing spending patterns
- Notes section for pending payments

# DOM Concepts Used

- `getElementById()`  
- `querySelector()` and `querySelectorAll()`  
- Event listeners (`click`, `input`, `keydown`)  
- Dynamic DOM creation using `createElement()`  
- DOM updates using `appendChild`, `innerText`, `innerHTML`  
- Dataset attributes  
- CSS class toggling  
- Modal handling using DOM  
- Canvas API for graph rendering  

# Steps to Run the Project

1. Open the deployed GitHub Pages link
2. Create a new user account using the Signup option
3. Log in using the created credentials
4. Start adding expenses, income, and savings

No installation or setup is required.

# Known Limitations

- Data is stored only in browser LocalStorage
- Data is cleared if browser storage is cleared
- No backend or database integration
- Passwords are not encrypted (for learning purposes only)
