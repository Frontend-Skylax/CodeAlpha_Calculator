const displayQuestion = document.getElementById("question");
const displayAnswer = document.getElementById("answer");
const buttons = document.querySelectorAll("button");

// State
let question = "";
let answer = "";
let previousAnswer = "";

// --- Math helpers ---
const degToRad = (d) => d * (Math.PI / 180);
const radToDeg = (r) => r * (180 / Math.PI);

function factorial(n) {
  n = Number(n);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return NaN;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}
function log10(x) {
  return Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10;
}

// convert degrees to radians
function sinSmart(x) {
  return Math.abs(x) > 2 * Math.PI ? Math.sin(degToRad(x)) : Math.sin(x);
}
function cosSmart(x) {
  return Math.abs(x) > 2 * Math.PI ? Math.cos(degToRad(x)) : Math.cos(x);
}
function tanSmart(x) {
  return Math.abs(x) > 2 * Math.PI ? Math.tan(degToRad(x)) : Math.tan(x);
}
function asinSmart(x) { return radToDeg(Math.asin(x)); }
function acosSmart(x) { return radToDeg(Math.acos(x)); }
function atanSmart(x) { return radToDeg(Math.atan(x)); }

// User Interface
function updateDisplay() {
  displayQuestion.innerText = question || "Enter function";
  displayAnswer.innerText = (answer !== "" ? String(answer) : "");
}

function autoCloseParens(expr) {
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  return close < open ? expr + ")".repeat(open - close) : expr;
}

// sanitize user expression 
function sanitizeExpression(expr) {
  expr = autoCloseParens(expr);

  // factorial 
  expr = expr.replace(/(\d+|\([^()]+\))!/g, (_, group) => `factorial(${group})`);

  //replace inverse trig names first (if present)
  return expr
    .replace(/π/g, "Math.PI")
    .replace(/√\(/g, "Math.sqrt(")
    // inverse trig (if UI uses them)
    .replace(/\bsin⁻¹\(/g, "asinSmart(")
    .replace(/\bcos⁻¹\(/g, "acosSmart(")
    .replace(/\btan⁻¹\(/g, "atanSmart(")
    // smart trig (convert sin( -> sinSmart)
    .replace(/\bsin\(/g, "sinSmart(")
    .replace(/\bcos\(/g, "cosSmart(")
    .replace(/\btan\(/g, "tanSmart(")
    .replace(/\blog\(/g, "log10(")
    .replace(/\bln\(/g, "Math.log(")
    // exponent shortcuts
    .replace(/x²/g, "**2")
    .replace(/x⁻¹/g, "**-1")
    .replace(/xʸ/g, "**")
    .replace(/\^/g, "**");
}

// calculate: sanitize -> eval -> format
function calculateExpression(rawExp) {
  try {
    const expr = sanitizeExpression(rawExp);
    const rawResult = eval(expr); 
    // keep numeric precision reasonable
    if (typeof rawResult === "number" && Number.isFinite(rawResult)) {
      const rounded = parseFloat(rawResult.toFixed(8));
      return rounded;
    }
    return rawResult;
  } catch (err) {
    return "Error";
  }
}

// Input handling both buttons and keyboard

// handler used by both mouse and keyboard
function handleInput(input) {
  // Normalize whitespace and innerText quirks
  input = String(input);

  if (input === "AC") {
    question = "";
    answer = "";
  } else if (input === "DEL") {
    question = question.slice(0, -1);
  } else if (input === "=" || input === "Ans") {
    if (question.trim() !== "") {
      answer = calculateExpression(question);
      previousAnswer = answer;
      // to keep or clear the question after evaluation
    } else if (previousAnswer !== "") {
      answer = previousAnswer;
    }
  } else if (input === "π") {
    question += "π";
  } else if (["sin", "cos", "tan"].includes(input)) {
    question += input + "(";
  } else if (input === "√") {
    question += "√(";
  } else if (input === "log") {
    question += "log(";
  } else if (input === "ln") {
    question += "ln(";
  } else if (input === "x²") {
    question += "x²";
  } else if (input === "xʸ") {
    question += "xʸ";
  } else {
    // to add numbers, operators, parentheses, ! afterwards.
    question += input;
  }

  updateDisplay();
}

//button listeners
buttons.forEach(btn => {
  btn.addEventListener("click", () => handleInput(btn.innerText));
});

// keyboard support
document.addEventListener("keydown", (e) => {
  const k = e.key;

  // digits
  if (!isNaN(k)) {
    handleInput(k);
    return;
  }

  // allows basic operators
  if (["+", "-", "*", "/", ".", "(", ")", "^", "!"].includes(k)) {
    handleInput(k);
    return;
  }

  // ignore other keys to avoid accidental input
  if (k === "Enter") { handleInput("="); return; }
  if (k === "Backspace") { handleInput("DEL"); return; }
  if (k === "Escape") { handleInput("AC"); return; }
});

updateDisplay();
