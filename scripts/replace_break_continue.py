import json

filepath = '/home/vibe/projects/agaicode-internship-evaluatio/data/javascript.json'

with open(filepath, 'r') as f:
    data = json.load(f)

replacements = {
    74: {
        "q": "Which loop structure guarantees that its code block will execute AT LEAST ONCE before checking the condition?",
        "options": {
            "A": "for loop",
            "B": "while loop",
            "C": "do...while loop",
            "D": "for...of loop"
        },
        "answer": "C",
        "explanation": "do...while loop executes the code block first, then checks the condition at the end."
    },
    75: {
        "q": "What happens if a loop's condition never becomes false?",
        "options": {
            "A": "The loop executes only 1 time",
            "B": "It creates an infinite loop and freezes or crashes the program",
            "C": "The browser automatically fixes it",
            "D": "It skips to the next section of code"
        },
        "answer": "B",
        "explanation": "If the loop condition is always true (e.g. while(true) without an update), it creates an infinite loop."
    },
    82: {
        "q": "Match each loop statement with its description.",
        "dragItems": [
            "Repeats code a set number of times with counter",
            "Repeats as long as condition remains true",
            "Executes code block at least once before checking",
            "Iterates directly over elements of an array or iterable"
        ],
        "dropZones": [
            "for loop",
            "while loop",
            "do...while loop",
            "for...of loop"
        ],
        "answer": {
            "0": "Repeats code a set number of times with counter",
            "1": "Repeats as long as condition remains true",
            "2": "Executes code block at least once before checking",
            "3": "Iterates directly over elements of an array or iterable"
        },
        "explanation": "Types of loops in JavaScript."
    },
    83: {
        "q": "Match each loop concept with its correct description.",
        "dragItems": [
            "Checks condition BEFORE each iteration",
            "Checks condition AFTER each iteration (runs at least once)",
            "Iterates directly over array values",
            "Variable used to track the current iteration (e.g. let i = 0)"
        ],
        "dropZones": [
            "while",
            "do...while",
            "for...of",
            "loop counter"
        ],
        "answer": {
            "0": "Checks condition BEFORE each iteration",
            "1": "Checks condition AFTER each iteration (runs at least once)",
            "2": "Iterates directly over array values",
            "3": "Variable used to track the current iteration (e.g. let i = 0)"
        },
        "explanation": "while checks condition first. do...while runs body first. for...of iterates over array values."
    },
    169: {
        "q": "How many times will the following loop run?\n\n```js\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n```",
        "options": {
            "A": "4 times",
            "B": "5 times",
            "C": "6 times",
            "D": "0 times"
        },
        "answer": "B",
        "explanation": "The loop runs for i = 0, 1, 2, 3, 4, which is a total of 5 times."
    },
    171: {
        "q": "What is printed to the console?\n\n```js\nlet i = 1;\nwhile (i <= 3) {\n  console.log(i * 2);\n  i++;\n}\n```",
        "options": {
            "A": "1\n2\n3",
            "B": "2\n4\n6",
            "C": "2\n4\n6\n8",
            "D": "0\n2\n4"
        },
        "answer": "B",
        "explanation": "The loop runs for i = 1 (logs 2), i = 2 (logs 4), i = 3 (logs 6)."
    },
    172: {
        "q": "What is the output?\n\n```js\nlet sum = 0;\nfor (let i = 1; i <= 3; i++) {\n  sum += i;\n}\nconsole.log(sum);\n```",
        "options": {
            "A": "3",
            "B": "5",
            "C": "6",
            "D": "9"
        },
        "answer": "C",
        "explanation": "sum becomes 0 + 1 + 2 + 3 = 6."
    },
    181: {
        "q": "Write a `while` loop that calculates the sum of numbers from `1` to `5` and stores it in variable `total`.",
        "starterCode": "let total = 0;\nlet i = 1;\n// write your while loop here",
        "answer": "let total = 0;\nlet i = 1;\nwhile (i <= 5) {\n  total += i;\n  i++;\n}",
        "explanation": "Use a while loop with i <= 5 to accumulate total += i in each iteration."
    },
    183: {
        "q": "Write a `for` loop to print odd numbers from `1` to `9` by incrementing loop counter `i` by `2` (`i += 2`).",
        "starterCode": "for (let i = 1; i <= 9; i += 2) {\n  console.log(i);\n}",
        "answer": "for (let i = 1; i <= 9; i += 2) {\n  console.log(i);\n}",
        "explanation": "Incrementing i by 2 starting from 1 prints 1, 3, 5, 7, 9."
    },
    184: {
        "q": "Write a `for` loop that prints numbers from `10` down to `1` in reverse order.",
        "starterCode": "for (let i = 10; i >= 1; i--) {\n  console.log(i);\n}",
        "answer": "for (let i = 10; i >= 1; i--) {\n  console.log(i);\n}",
        "explanation": "Start at 10, condition i >= 1, decrement i--."
    }
}

updated_count = 0
for q in data:
    qid = q.get('id')
    if qid in replacements:
        q.update(replacements[qid])
        updated_count += 1

with open(filepath, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Successfully replaced break/continue in {updated_count} loop questions!")
