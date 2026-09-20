"""
Update specific short_code question texts to wrap code terms in backticks.
Only touching questions that need it (IDs 177+).
"""
import json

with open('data/javascript.json') as f:
    d = json.load(f)

# Map of id -> updated question text
updates = {
    181: "Write a `while(true)` loop that starts from `1` and keeps incrementing, but `break`s as soon as it finds a number divisible by both `3` AND `5`. Print that number.",

    185: "Use a `while` loop to print the multiplication table of `3` (`3×1` to `3×10`).\nEach line should look like: `3 x 1 = 3`",

    186: "Write a **nested** `for` loop that prints a `3×3` pattern of asterisks (`*`), one row at a time.",

    193: "Create a 2D array representing a `2×3` grid:\n- Row 1: `[1, 2, 3]`\n- Row 2: `[4, 5, 6]`\n\nThen `console.log` the element at row `1`, column `2` (value `6`).",

    206: "Given `const firstName = 'Ali'` and `const age = 22`, use a **template literal** to print:\n`My name is Ali and I am 22 years old.`",

    222: "Write a function `greet` that takes a `name` parameter and `return`s the string `'Hello, [name]!'`.\nThen call it with `'Hassan'` and `console.log` the result.",

    223: "Rewrite the `greet` function as an **arrow function** assigned to a `const` variable.\nIt should still take `name` and return `'Hello, [name]!'`.",

    224: "Write a function `add` that takes two numbers `a` and `b` and `return`s their sum.\nUse a default value of `0` for `b`.\n\nTest: `add(5)` → `5`, `add(5, 3)` → `8`",

    225: "Write a function `isAdult` that takes an `age` number and returns `true` if `age >= 18`, otherwise `false`.",

    226: "Write an arrow function `square` that takes a number and returns its square.\nUse the **shortest** syntax — no `{}` braces, no `return` keyword.\n\nExample: `square(7)` → `49`",

    227: "Write a function `getMax` that takes two numbers and returns the **larger** one.\nUse a **ternary operator** (`? :`) inside the function.",

    228: "Write a function using **rest parameters** (`...args`) that accepts any number of numbers and returns their total `sum`.\n\nExample: `sum(1, 2, 3, 4, 5)` → `15`",

    229: "Write a function `repeat` that takes a `str` (string) and `n` (number), and returns the string repeated `n` times using a loop.\n\nExample: `repeat('ha', 3)` → `'hahaha'`",

    230: "Write an arrow function `celsiusToFahrenheit` that converts Celsius to Fahrenheit.\nFormula: `F = (C × 9/5) + 32`\n\nTest it with `100°C` → should print `212`.",

    231: "Write a function `describe` that takes `name` (string) and `age` (number) and returns:\n`'[name] is [age] years old.'`\n\nCall it and `console.log` the result.",
}

changed = 0
for i, q in enumerate(d):
    qid = q.get('id')
    if qid in updates:
        d[i]['q'] = updates[qid]
        changed += 1

print(f"Updated {changed} question texts")

with open('data/javascript.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)

print("✅ Done!")
