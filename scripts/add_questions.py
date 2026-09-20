"""
Script to add new questions to javascript.json
Targets:
- Loops: 10 quiz, 10 prediction (short_code output-tracing), 10 code_writing (short_code write)
- Arrays: 10 quiz, 10 prediction, 10 code_writing  (no map/filter/reduce/forEach)
- Template Literals & Strings: 8 quiz, 8 prediction, 8 code_writing
- Functions: 10 quiz, 10 prediction, 10 code_writing
"""
import json

with open('data/javascript.json') as f:
    existing = json.load(f)

# Current counts
SECTION = "JS"

def mk_quiz(id, topic, q, options, answer, explanation):
    return {"section": SECTION, "topic": topic, "type": "quiz", "q": q,
            "options": options, "answer": answer, "explanation": explanation, "id": id}

def mk_predict(id, topic, q, code, answer, explanation):
    """Output prediction / mental trace question"""
    return {"section": SECTION, "topic": topic, "type": "short_code",
            "q": f"🔍 Predict the Output:\n\n```js\n{code}\n```\n\n{q}",
            "starterCode": "", "answer": answer, "explanation": explanation, "id": id}

def mk_code(id, topic, q, starterCode, answer, explanation):
    """Code writing question"""
    return {"section": SECTION, "topic": topic, "type": "short_code",
            "q": q, "starterCode": starterCode, "answer": answer,
            "explanation": explanation, "id": id}

new_questions = []
next_id = 167

# ============================================================
# TOPIC 1: Loops (for, while, do-while, for...of, for...in)
# Current: 7 quiz, 3 short_code, 2 drag_drop = 12
# Need: 10 quiz, 10 prediction, 10 code_writing = 30
# Add: 3 quiz, 7 prediction, 10 code_writing = 20 new
# ============================================================
LOOPS = "Loops (for, while, do-while, for...of, for...in)"

# --- 3 more QUIZ ---
new_questions.append(mk_quiz(next_id, LOOPS,
    "What is the output of this code?\n\nfor (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
    {"A": "0 1 2", "B": "1 2 3", "C": "0 1 2 3", "D": "0"},
    "A", "A for loop starting at i=0 with condition i<3 prints 0, 1, 2 then stops when i becomes 3."
))
next_id += 1

new_questions.append(mk_quiz(next_id, LOOPS,
    "Which loop is guaranteed to execute its body AT LEAST once?",
    {"A": "for loop", "B": "while loop", "C": "do...while loop", "D": "for...of loop"},
    "C", "The do...while loop executes the body first and checks the condition afterwards, so it always runs at least once."
))
next_id += 1

new_questions.append(mk_quiz(next_id, LOOPS,
    "What does the `continue` statement do inside a loop?",
    {"A": "Exits the loop completely", "B": "Skips the rest of the current iteration and moves to the next",
     "C": "Pauses the loop for 1 second", "D": "Resets the loop counter to 0"},
    "B", "`continue` skips the remaining code in the current iteration and jumps to the next loop cycle."
))
next_id += 1

# --- 7 PREDICTION (output tracing) ---
new_questions.append(mk_predict(next_id, LOOPS,
    "What is printed to the console?",
    "let sum = 0;\nfor (let i = 1; i <= 4; i++) {\n  sum += i;\n}\nconsole.log(sum);",
    "10",
    "The loop adds 1+2+3+4 = 10 to sum."
))
next_id += 1

new_questions.append(mk_predict(next_id, LOOPS,
    "What is the output?",
    "let i = 0;\nwhile (i < 5) {\n  if (i === 3) break;\n  console.log(i);\n  i++;\n}",
    "0\n1\n2",
    "The loop prints i=0,1,2 then when i===3 it hits `break` and exits the loop."
))
next_id += 1

new_questions.append(mk_predict(next_id, LOOPS,
    "What is printed?",
    "for (let i = 0; i < 6; i++) {\n  if (i % 2 === 0) continue;\n  console.log(i);\n}",
    "1\n3\n5",
    "The `continue` skips even numbers (0, 2, 4), so only odd numbers 1, 3, 5 are printed."
))
next_id += 1

new_questions.append(mk_predict(next_id, LOOPS,
    "What is the output?",
    "const fruits = ['apple', 'banana', 'cherry'];\nfor (const fruit of fruits) {\n  console.log(fruit);\n}",
    "apple\nbanana\ncherry",
    "for...of iterates over array values directly, printing each element."
))
next_id += 1

new_questions.append(mk_predict(next_id, LOOPS,
    "What does this print?",
    "let x = 5;\ndo {\n  console.log(x);\n  x--;\n} while (x > 3);",
    "5\n4",
    "do...while runs first at x=5, then x becomes 4 (4>3 is true so runs again), then x becomes 3 (3>3 is false so stops)."
))
next_id += 1

new_questions.append(mk_predict(next_id, LOOPS,
    "What is printed to the console?",
    "const person = { name: 'Ali', age: 20, city: 'Karachi' };\nfor (const key in person) {\n  console.log(key);\n}",
    "name\nage\ncity",
    "for...in iterates over the keys (property names) of an object."
))
next_id += 1

new_questions.append(mk_predict(next_id, LOOPS,
    "What is the output?",
    "let count = 0;\nfor (let i = 1; i <= 10; i++) {\n  if (i % 3 === 0) count++;\n}\nconsole.log(count);",
    "3",
    "Numbers 1-10 divisible by 3 are: 3, 6, 9 — that's 3 numbers."
))
next_id += 1

# --- 10 CODE WRITING ---
new_questions.append(mk_code(next_id, LOOPS,
    "Write a `for` loop that prints numbers from 1 to 5 to the console.",
    "",
    "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}",
    "Use a for loop with initialization i=1, condition i<=5, and increment i++ to print 1 through 5."
))
next_id += 1

new_questions.append(mk_code(next_id, LOOPS,
    "Write a `while` loop that prints all even numbers from 2 to 10.",
    "let i = 2;\n// write your while loop here",
    "let i = 2;\nwhile (i <= 10) {\n  console.log(i);\n  i += 2;\n}",
    "Start at i=2, check i<=10, print i, then add 2 each time to get the next even number."
))
next_id += 1

new_questions.append(mk_code(next_id, LOOPS,
    "Write a `do...while` loop that counts down from 5 to 1 and prints each number.",
    "let n = 5;\n// write your do...while here",
    "let n = 5;\ndo {\n  console.log(n);\n  n--;\n} while (n >= 1);",
    "do...while prints n first, then decrements. Keeps running while n>=1."
))
next_id += 1

new_questions.append(mk_code(next_id, LOOPS,
    "Use `for...of` to loop over the array `['red', 'green', 'blue']` and `console.log` each color.",
    "const colors = ['red', 'green', 'blue'];\n// write your for...of here",
    "const colors = ['red', 'green', 'blue'];\nfor (const color of colors) {\n  console.log(color);\n}",
    "for...of gives you the value of each element directly without needing an index."
))
next_id += 1

new_questions.append(mk_code(next_id, LOOPS,
    "Use `for...in` to loop over the object `{ name: 'Sara', age: 22 }` and print each KEY.",
    "const student = { name: 'Sara', age: 22 };\n// write your for...in here",
    "const student = { name: 'Sara', age: 22 };\nfor (const key in student) {\n  console.log(key);\n}",
    "for...in iterates over enumerable property names (keys) of an object."
))
next_id += 1

new_questions.append(mk_code(next_id, LOOPS,
    "Write a `for` loop that calculates the sum of numbers from 1 to 10 and stores it in a variable `total`.",
    "let total = 0;\n// write your loop here\nconsole.log(total);",
    "let total = 0;\nfor (let i = 1; i <= 10; i++) {\n  total += i;\n}\nconsole.log(total);",
    "Loop from 1 to 10 adding each value to total. Result: 55."
))
next_id += 1

new_questions.append(mk_code(next_id, LOOPS,
    "Write a loop that prints only ODD numbers from 1 to 9 using a `for` loop and the `continue` statement.",
    "// use continue to skip even numbers",
    "for (let i = 1; i <= 9; i++) {\n  if (i % 2 === 0) continue;\n  console.log(i);\n}",
    "Use i % 2 === 0 to detect even numbers, then `continue` to skip them."
))
next_id += 1

new_questions.append(mk_code(next_id, LOOPS,
    "Write a `for` loop that finds the FIRST number between 1-20 divisible by both 3 and 5, then `break`s.",
    "// find the first multiple of both 3 and 5",
    "for (let i = 1; i <= 20; i++) {\n  if (i % 3 === 0 && i % 5 === 0) {\n    console.log(i);\n    break;\n  }\n}",
    "15 is the first number divisible by both 3 and 5. `break` exits the loop once found."
))
next_id += 1

new_questions.append(mk_code(next_id, LOOPS,
    "Use a `while` loop to print the multiplication table of 3 (3×1 to 3×10).",
    "let i = 1;\n// write your while loop",
    "let i = 1;\nwhile (i <= 10) {\n  console.log(`3 x ${i} = ${3 * i}`);\n  i++;\n}",
    "Use template literals inside a while loop to format and print each multiplication result."
))
next_id += 1

new_questions.append(mk_code(next_id, LOOPS,
    "Write a nested `for` loop that prints a 3×3 pattern of asterisks (*), one row at a time.",
    "// nested for loop for 3x3 pattern",
    "for (let row = 1; row <= 3; row++) {\n  let line = '';\n  for (let col = 1; col <= 3; col++) {\n    line += '* ';\n  }\n  console.log(line.trim());\n}",
    "Outer loop controls rows, inner loop builds each row's asterisk string, then log each row."
))
next_id += 1

# ============================================================
# TOPIC 2: Arrays & Array Methods (push, pop, shift, unshift, indexOf)
# Current: 11 quiz, 4 short_code, 2 drag_drop = 17
# Need: 10 quiz, 10 prediction, 10 code_writing = 30
# Already have enough quiz (11), but need more prediction & code
# Strategy: keep all existing, add 6 more prediction + 6 code_writing + cover 2D arrays + extra methods
# But user said 10+10+10 = 30. We need 13 more total.
# Add: 0 quiz (already 11), +6 prediction, +7 code_writing = 13 new
# ============================================================
ARRAYS = "Arrays & Array Methods (push, pop, shift, unshift, indexOf)"

# --- 6 more PREDICTION ---
new_questions.append(mk_predict(next_id, ARRAYS,
    "What is the output?",
    "const nums = [10, 20, 30];\nnums.push(40);\nconsole.log(nums.length);",
    "4",
    "push() adds 40 to the end, making the array [10,20,30,40] with length 4."
))
next_id += 1

new_questions.append(mk_predict(next_id, ARRAYS,
    "What does this print?",
    "const arr = [1, 2, 3, 4, 5];\nconst last = arr.pop();\nconsole.log(last);\nconsole.log(arr);",
    "5\n[1, 2, 3, 4]",
    "pop() removes and returns the last element (5). The array is now [1,2,3,4]."
))
next_id += 1

new_questions.append(mk_predict(next_id, ARRAYS,
    "What is the output?",
    "const letters = ['a', 'b', 'c'];\nconst first = letters.shift();\nconsole.log(first);\nconsole.log(letters);",
    "a\n['b', 'c']",
    "shift() removes and returns the first element ('a'). Remaining: ['b','c']."
))
next_id += 1

new_questions.append(mk_predict(next_id, ARRAYS,
    "What does this code print?",
    "const matrix = [[1, 2], [3, 4], [5, 6]];\nconsole.log(matrix[1][0]);",
    "3",
    "matrix[1] is [3,4]. matrix[1][0] is the first element of that row: 3."
))
next_id += 1

new_questions.append(mk_predict(next_id, ARRAYS,
    "What is the output?",
    "const items = ['pen', 'pencil', 'ruler'];\nconsole.log(items.indexOf('pencil'));\nconsole.log(items.indexOf('eraser'));",
    "1\n-1",
    "indexOf returns the index of found item (1 for 'pencil') or -1 if not found ('eraser' is not in array)."
))
next_id += 1

new_questions.append(mk_predict(next_id, ARRAYS,
    "What is printed?",
    "const a = [1, 2, 3];\na.unshift(0);\nconsole.log(a);",
    "[0, 1, 2, 3]",
    "unshift() adds 0 to the beginning of the array, resulting in [0,1,2,3]."
))
next_id += 1

# --- 7 CODE WRITING (including 2D arrays) ---
new_questions.append(mk_code(next_id, ARRAYS,
    "Create a 2D array representing a 2×3 grid of numbers:\nRow 1: [1, 2, 3]\nRow 2: [4, 5, 6]\nThen `console.log` the element at row 1, column 2 (value 6).",
    "// create 2D array\nconst grid = ;\nconsole.log(grid[1][2]);",
    "const grid = [[1, 2, 3], [4, 5, 6]];\nconsole.log(grid[1][2]);",
    "2D arrays are arrays of arrays. grid[1] is [4,5,6], grid[1][2] is 6."
))
next_id += 1

new_questions.append(mk_code(next_id, ARRAYS,
    "Create an array `colors` with values `['red', 'green']`. Then:\n1. Add `'blue'` to the END using `push()`\n2. Add `'yellow'` to the BEGINNING using `unshift()`\n3. `console.log` the final array.",
    "const colors = ['red', 'green'];\n// 1. push 'blue'\n// 2. unshift 'yellow'\nconsole.log(colors);",
    "const colors = ['red', 'green'];\ncolors.push('blue');\ncolors.unshift('yellow');\nconsole.log(colors);",
    "push() adds to end, unshift() adds to beginning. Result: ['yellow','red','green','blue']."
))
next_id += 1

new_questions.append(mk_code(next_id, ARRAYS,
    "Given `const scores = [88, 92, 75, 96, 83]`, write code to:\n1. Remove the last score using `pop()`\n2. Remove the first score using `shift()`\n3. `console.log` the remaining array.",
    "const scores = [88, 92, 75, 96, 83];\n// remove last and first\nconsole.log(scores);",
    "const scores = [88, 92, 75, 96, 83];\nscores.pop();\nscores.shift();\nconsole.log(scores);",
    "pop() removes 83, shift() removes 88. Remaining: [92, 75, 96]."
))
next_id += 1

new_questions.append(mk_code(next_id, ARRAYS,
    "Write code to check if `'mango'` exists in the array `['apple', 'banana', 'mango', 'kiwi']` using `indexOf()`. Print `'Found'` if it exists, otherwise print `'Not Found'`.",
    "const fruits = ['apple', 'banana', 'mango', 'kiwi'];\n// use indexOf to check",
    "const fruits = ['apple', 'banana', 'mango', 'kiwi'];\nif (fruits.indexOf('mango') !== -1) {\n  console.log('Found');\n} else {\n  console.log('Not Found');\n}",
    "indexOf returns -1 if not found. Checking !== -1 confirms the item exists."
))
next_id += 1

new_questions.append(mk_code(next_id, ARRAYS,
    "Use `array.includes()` to check if the number `42` is in the array `[10, 20, 42, 80]`. Store the result in a variable `found` and print it.",
    "const nums = [10, 20, 42, 80];\nconst found = ;\nconsole.log(found);",
    "const nums = [10, 20, 42, 80];\nconst found = nums.includes(42);\nconsole.log(found);",
    "includes() returns true if value is found, false otherwise. Here it returns true."
))
next_id += 1

new_questions.append(mk_code(next_id, ARRAYS,
    "Create a 2D array for a student's marks:\n- Maths: [85, 90, 78]\n- English: [72, 88, 95]\n\nUse a `for` loop to print each subject's marks array.",
    "const marks = [\n  // add your 2 sub-arrays here\n];\nfor (let i = 0; i < marks.length; i++) {\n  console.log(marks[i]);\n}",
    "const marks = [\n  [85, 90, 78],\n  [72, 88, 95]\n];\nfor (let i = 0; i < marks.length; i++) {\n  console.log(marks[i]);\n}",
    "A 2D array stores arrays inside arrays. The outer loop iterates over each subject row."
))
next_id += 1

new_questions.append(mk_code(next_id, ARRAYS,
    "Write code to reverse an array `[1, 2, 3, 4, 5]` using the `.reverse()` method and `console.log` the result.",
    "const arr = [1, 2, 3, 4, 5];\n// reverse the array\nconsole.log(arr);",
    "const arr = [1, 2, 3, 4, 5];\narr.reverse();\nconsole.log(arr);",
    "The reverse() method reverses the array in place. Result: [5,4,3,2,1]."
))
next_id += 1

# ============================================================
# TOPIC 3: Template Literals & String Concatenation
# Current: 7 quiz, 3 short_code, 2 drag_drop = 12
# Need: 8 quiz, 8 prediction, 8 code_writing = 24
# Add: 1 quiz, 5 prediction, 6 code_writing = 12 new
# ============================================================
STRINGS = "Template Literals & String Concatenation"

# --- 1 more QUIZ ---
new_questions.append(mk_quiz(next_id, STRINGS,
    "Which string method returns the number of characters in a string?",
    {"A": "string.size()", "B": "string.count()", "C": "string.length", "D": "string.chars()"},
    "C", "`.length` is a property (not a method call) that returns the number of characters in a string."
))
next_id += 1

# --- 5 PREDICTION ---
new_questions.append(mk_predict(next_id, STRINGS,
    "What is the output?",
    "const name = 'Ahmed';\nconst greeting = `Hello, ${name}! You are student #${1 + 2}.`;\nconsole.log(greeting);",
    "Hello, Ahmed! You are student #3.",
    "Template literals evaluate expressions inside ${}. 'Ahmed' is interpolated and 1+2=3."
))
next_id += 1

new_questions.append(mk_predict(next_id, STRINGS,
    "What does this print?",
    "const city = 'Karachi';\nconsole.log(city.toUpperCase());\nconsole.log(city.toLowerCase());",
    "KARACHI\nkarachi",
    "toUpperCase() converts all letters to uppercase, toLowerCase() to lowercase."
))
next_id += 1

new_questions.append(mk_predict(next_id, STRINGS,
    "What is the output?",
    "const str = '  Hello World  ';\nconsole.log(str.trim());",
    "Hello World",
    "trim() removes whitespace from both the beginning and end of a string."
))
next_id += 1

new_questions.append(mk_predict(next_id, STRINGS,
    "What is printed?",
    "const text = 'JavaScript is fun';\nconsole.log(text.includes('fun'));\nconsole.log(text.startsWith('Java'));",
    "true\ntrue",
    "includes() checks if substring exists (returns true). startsWith() checks beginning of string (returns true for 'Java')."
))
next_id += 1

new_questions.append(mk_predict(next_id, STRINGS,
    "What is the output?",
    "const str = 'hello world';\nconsole.log(str.replace('world', 'Pakistan'));\nconsole.log(str.split(' '));",
    "hello Pakistan\n['hello', 'world']",
    "replace() swaps the first match. split(' ') breaks the string into an array on spaces."
))
next_id += 1

# --- 6 CODE WRITING ---
new_questions.append(mk_code(next_id, STRINGS,
    "Given `const firstName = 'Ali'` and `const age = 22`, use a **template literal** to print:\n`My name is Sameen and I am 20 years old.`",
    "const firstName = 'Ali';\nconst age = 22;\nconsole.log(/* use template literal */);",
    "const firstName = 'Ali';\nconst age = 22;\nconsole.log(`My name is ${firstName} and I am ${age} years old.`);",
    "Template literals use backticks and ${} for expressions. String concatenation using + also works."
))
next_id += 1

new_questions.append(mk_code(next_id, STRINGS,
    "Write code using string methods to:\n1. Convert `'javascript'` to uppercase\n2. Check if it `includes('SCRIPT')`\n3. Print both results.",
    "const lang = 'javascript';\n// 1. convert to uppercase\n// 2. check includes",
    "const lang = 'javascript';\nconst upper = lang.toUpperCase();\nconsole.log(upper);\nconsole.log(upper.includes('SCRIPT'));",
    "toUpperCase() converts to 'JAVASCRIPT'. includes('SCRIPT') on the uppercase version returns true."
))
next_id += 1

new_questions.append(mk_code(next_id, STRINGS,
    "Create a multiline template literal that stores a student card:\n```\nName: Sara\nAge: 20\nCity: Lahore\n```\nStore it in a variable `card` and `console.log` it.",
    "const name = 'Sara', age = 20, city = 'Lahore';\nconst card = /* write template literal here */;\nconsole.log(card);",
    "const name = 'Sara', age = 20, city = 'Lahore';\nconst card = `Name: ${name}\nAge: ${age}\nCity: ${city}`;\nconsole.log(card);",
    "Template literals support multiline strings naturally — just press Enter inside the backticks."
))
next_id += 1

new_questions.append(mk_code(next_id, STRINGS,
    "Given the string `'  hello world  '`, write code to:\n1. `trim()` the whitespace\n2. `split(' ')` it into an array\n3. `console.log` the resulting array.",
    "const str = '  hello world  ';\n// 1. trim\n// 2. split\n// 3. log",
    "const str = '  hello world  ';\nconst trimmed = str.trim();\nconst words = trimmed.split(' ');\nconsole.log(words);",
    "trim() removes spaces. split(' ') breaks on spaces → ['hello', 'world']."
))
next_id += 1

new_questions.append(mk_code(next_id, STRINGS,
    "Write code to replace ALL occurrences of `'cat'` with `'dog'` in the string `'I have a cat. My cat is cute.'` using `replaceAll()`, then `console.log` the result.",
    "const str = 'I have a cat. My cat is cute.';\n// use replaceAll\nconsole.log( );",
    "const str = 'I have a cat. My cat is cute.';\nconsole.log(str.replaceAll('cat', 'dog'));",
    "replaceAll() replaces every occurrence. Output: 'I have a dog. My dog is cute.'"
))
next_id += 1

new_questions.append(mk_code(next_id, STRINGS,
    "Use `string.slice()` to extract `'World'` from the string `'Hello World'` and `console.log` it.\n(Hint: 'World' starts at index 6)",
    "const str = 'Hello World';\nconst extracted = str.slice(/* start, end */);\nconsole.log(extracted);",
    "const str = 'Hello World';\nconst extracted = str.slice(6);\nconsole.log(extracted);",
    "slice(6) returns characters from index 6 to the end: 'World'."
))
next_id += 1

# ============================================================
# TOPIC 4: Basic Functions & Arrow Functions
# Current: 7 quiz, 3 short_code, 2 drag_drop = 12
# Need: 10 quiz, 10 prediction, 10 code_writing = 30
# Add: 3 quiz, 7 prediction, 10 code_writing = 20 new
# ============================================================
FUNCTIONS = "Basic Functions & Arrow Functions"

# --- 3 more QUIZ ---
new_questions.append(mk_quiz(next_id, FUNCTIONS,
    "Which of the following is a correct arrow function syntax?",
    {"A": "function => (x) { return x * 2; }", "B": "const double = (x) => x * 2;",
     "C": "const double => (x) { return x * 2; }", "D": "arrow double(x) { return x * 2; }"},
    "B", "Arrow functions use: const funcName = (params) => expression or body. Option B is the correct syntax."
))
next_id += 1

new_questions.append(mk_quiz(next_id, FUNCTIONS,
    "What is the default return value of a function that has no `return` statement?",
    {"A": "0", "B": "null", "C": "undefined", "D": "false"},
    "C", "In JavaScript, if a function has no return statement, it implicitly returns `undefined`."
))
next_id += 1

new_questions.append(mk_quiz(next_id, FUNCTIONS,
    "What is a 'default parameter' in a function?",
    {"A": "A parameter that is always required", "B": "A value used when no argument is passed",
     "C": "The last parameter in a function", "D": "A global variable used in functions"},
    "B", "Default parameters provide fallback values if no argument (or undefined) is passed for that parameter."
))
next_id += 1

# --- 7 PREDICTION ---
new_questions.append(mk_predict(next_id, FUNCTIONS,
    "What is printed?",
    "function greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet('Zara'));",
    "Hello, Zara!",
    "The function returns a template literal with the name interpolated. Calling greet('Zara') returns 'Hello, Zara!'."
))
next_id += 1

new_questions.append(mk_predict(next_id, FUNCTIONS,
    "What is the output?",
    "const add = (a, b) => a + b;\nconsole.log(add(3, 7));",
    "10",
    "Arrow function with implicit return: (a, b) => a + b returns a+b. 3+7=10."
))
next_id += 1

new_questions.append(mk_predict(next_id, FUNCTIONS,
    "What does this print?",
    "function multiply(x, y = 2) {\n  return x * y;\n}\nconsole.log(multiply(5));\nconsole.log(multiply(5, 3));",
    "10\n15",
    "y=2 is the default. multiply(5) uses y=2 → 10. multiply(5,3) overrides y=3 → 15."
))
next_id += 1

new_questions.append(mk_predict(next_id, FUNCTIONS,
    "What is the output?",
    "function isEven(n) {\n  return n % 2 === 0;\n}\nconsole.log(isEven(4));\nconsole.log(isEven(7));",
    "true\nfalse",
    "4 % 2 === 0 is true (even). 7 % 2 === 1 which is not 0, so false (odd)."
))
next_id += 1

new_questions.append(mk_predict(next_id, FUNCTIONS,
    "What is printed?",
    "const square = x => x * x;\nconsole.log(square(6));",
    "36",
    "Single-param arrow function with implicit return. 6*6=36."
))
next_id += 1

new_questions.append(mk_predict(next_id, FUNCTIONS,
    "What does this output?",
    "function counter() {\n  let count = 0;\n  count++;\n  return count;\n}\nconsole.log(counter());\nconsole.log(counter());",
    "1\n1",
    "Each call to counter() creates a NEW local `count` starting at 0, increments to 1, and returns 1. Both calls return 1."
))
next_id += 1

new_questions.append(mk_predict(next_id, FUNCTIONS,
    "What is the output?",
    "function sum(...nums) {\n  let total = 0;\n  for (const n of nums) total += n;\n  return total;\n}\nconsole.log(sum(1, 2, 3, 4));",
    "10",
    "Rest parameter `...nums` collects all arguments into an array [1,2,3,4]. Loop sums them: 10."
))
next_id += 1

# --- 10 CODE WRITING ---
new_questions.append(mk_code(next_id, FUNCTIONS,
    "Write a function `greet` that takes a `name` parameter and returns the string:\n`'Hello, [name]!'`\nThen call it with `'Hassan'` and `console.log` the result.",
    "// write function here\nconsole.log(greet('Hassan'));",
    "function greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet('Hassan'));",
    "Functions use the `function` keyword, take parameters, and use `return` to give back a value."
))
next_id += 1

new_questions.append(mk_code(next_id, FUNCTIONS,
    "Write the same `greet` function as an **arrow function** and assign it to a `const` variable.",
    "const greet = /* arrow function here */;\nconsole.log(greet('Hassan'));",
    "const greet = (name) => `Hello, ${name}!`;\nconsole.log(greet('Hassan'));",
    "Arrow functions are concise. Single expression arrow functions return implicitly without curly braces."
))
next_id += 1

new_questions.append(mk_code(next_id, FUNCTIONS,
    "Write a function `add` that takes two numbers `a` and `b` and returns their sum. Use a default value of `0` for `b`.",
    "function add(a, b = /* default */) {\n  // return sum\n}\nconsole.log(add(5));\nconsole.log(add(5, 3));",
    "function add(a, b = 0) {\n  return a + b;\n}\nconsole.log(add(5));\nconsole.log(add(5, 3));",
    "b=0 is the default. add(5) returns 5+0=5. add(5,3) returns 5+3=8."
))
next_id += 1

new_questions.append(mk_code(next_id, FUNCTIONS,
    "Write a function `isAdult` that takes an `age` number and returns `true` if age >= 18, otherwise `false`.",
    "function isAdult(age) {\n  // return true or false\n}\nconsole.log(isAdult(20));\nconsole.log(isAdult(15));",
    "function isAdult(age) {\n  return age >= 18;\n}\nconsole.log(isAdult(20));\nconsole.log(isAdult(15));",
    "age >= 18 directly returns a boolean. 20>=18 is true, 15>=18 is false."
))
next_id += 1

new_questions.append(mk_code(next_id, FUNCTIONS,
    "Write an arrow function `square` that takes a number and returns its square. Use the **shortest possible** syntax (no braces, no return keyword).",
    "const square = /* one-liner arrow function */;\nconsole.log(square(7));",
    "const square = n => n * n;\nconsole.log(square(7));",
    "Single param, single expression: no parentheses around param, no curly braces, no return needed. n => n*n."
))
next_id += 1

new_questions.append(mk_code(next_id, FUNCTIONS,
    "Write a function `getMax` that takes two numbers and returns the LARGER one. Use a ternary operator inside.",
    "function getMax(a, b) {\n  return /* ternary here */;\n}\nconsole.log(getMax(10, 25));",
    "function getMax(a, b) {\n  return a > b ? a : b;\n}\nconsole.log(getMax(10, 25));",
    "Ternary: a > b ? a : b returns a if a is bigger, else b. 25 is larger than 10."
))
next_id += 1

new_questions.append(mk_code(next_id, FUNCTIONS,
    "Write a function using **rest parameters** (`...args`) that accepts any number of numbers and returns their TOTAL sum.",
    "function sum(...args) {\n  // calculate sum of all args\n}\nconsole.log(sum(1, 2, 3, 4, 5));",
    "function sum(...args) {\n  let total = 0;\n  for (const n of args) total += n;\n  return total;\n}\nconsole.log(sum(1, 2, 3, 4, 5));",
    "...args collects all arguments into an array. Loop through and sum them. Result: 15."
))
next_id += 1

new_questions.append(mk_code(next_id, FUNCTIONS,
    "Write a function `repeat` that takes a string `str` and a number `n`, and returns the string repeated `n` times using a loop.",
    "function repeat(str, n) {\n  let result = '';\n  // loop n times and add str\n  return result;\n}\nconsole.log(repeat('ha', 3));",
    "function repeat(str, n) {\n  let result = '';\n  for (let i = 0; i < n; i++) {\n    result += str;\n  }\n  return result;\n}\nconsole.log(repeat('ha', 3));",
    "Loop n times concatenating str each iteration. repeat('ha', 3) → 'hahaha'."
))
next_id += 1

new_questions.append(mk_code(next_id, FUNCTIONS,
    "Write an arrow function `celsiusToFahrenheit` that converts Celsius to Fahrenheit.\nFormula: `F = (C × 9/5) + 32`\nTest it with 100°C.",
    "const celsiusToFahrenheit = (c) => /* formula */;\nconsole.log(celsiusToFahrenheit(100));",
    "const celsiusToFahrenheit = (c) => (c * 9/5) + 32;\nconsole.log(celsiusToFahrenheit(100));",
    "100°C = (100 × 9/5) + 32 = 180 + 32 = 212°F. Arrow functions can directly return expressions."
))
next_id += 1

new_questions.append(mk_code(next_id, FUNCTIONS,
    "Write a function `describe` that takes a `name` (string) and `age` (number) and returns:\n`'[name] is [age] years old.'`\nCall it and print the result.",
    "function describe(name, age) {\n  return /* template literal */;\n}\nconsole.log(describe('Ali', 21));",
    "function describe(name, age) {\n  return `${name} is ${age} years old.`;\n}\nconsole.log(describe('Ali', 21));",
    "Template literals with ${} interpolation make string formatting easy inside functions."
))
next_id += 1

# ============================================================
# Final assembly
# ============================================================
print(f"New questions to add: {len(new_questions)}")
print(f"New IDs: {next_id - len(new_questions)} to {next_id - 1}")

combined = existing + new_questions

# Validate
ids = [q.get('id') for q in combined]
print(f"Total questions: {len(combined)}")
print(f"Duplicate IDs: {[i for i in ids if ids.count(i) > 1]}")

with open('data/javascript.json', 'w', encoding='utf-8') as f:
    json.dump(combined, f, indent=2, ensure_ascii=False)

print("✅ Done! javascript.json updated.")
