import json

filepath = '/home/vibe/projects/agaicode-internship-evaluatio/data/javascript.json'

with open(filepath, 'r') as f:
    data = json.load(f)

updated_count = 0

for q in data:
    qid = q.get('id')
    if qid == 109:
        q['starterCode'] = "let firstName = 'Eman';\nlet lastName = 'Haider';\nlet fullName = "
        updated_count += 1
    elif qid == 126:
        q['q'] = "How do you access property `name` of an object `user = { name: 'Sameen Zehra' }` using dot notation?"
        updated_count += 1
    elif qid == 131:
        q['starterCode'] = "const student = { name: 'Shaina Zehra', age: 22 };\nlet studentAge = "
        updated_count += 1
    elif qid == 132:
        q['starterCode'] = "const user = { name: 'Hussain Mehdi' };\nuser."
        updated_count += 1
    elif qid == 201:
        q['q'] = "What is the output?\n\n```js\nconst name = 'Eman Haider';\nconst greeting = `Hello, ${name}! You are student #${1 + 2}.`;\nconsole.log(greeting);\n```"
        q['options']['B'] = "Hello, Eman Haider! You are student #3."
        q['options']['D'] = "Hello, Eman Haider! You are student #12."
        q['explanation'] = "Template literals evaluate ${} expressions. 'Eman Haider' and 1+2=3 are interpolated."
        updated_count += 1
    elif qid == 206:
        q['q'] = "Given `const firstName = 'Sameen Zehra'` and `const age = 22`, use a **template literal** to print:\n`My name is Sameen Zehra and I am 22 years old.`"
        q['starterCode'] = "const firstName = 'Sameen Zehra';\nconst age = 22;\nconsole.log(/* use template literal */);"
        q['answer'] = "const firstName = 'Sameen Zehra';\nconst age = 22;\nconsole.log(`My name is ${firstName} and I am ${age} years old.`);"
        updated_count += 1
    elif qid == 208:
        q['q'] = "Create a multiline template literal that stores a student card:\n```\nName: Shaina Zehra\nAge: 20\nCity: Lahore\n```\nStore it in a variable `card` and `console.log` it."
        q['starterCode'] = "const name = 'Shaina Zehra', age = 20, city = 'Lahore';\nconst card = /* write template literal here */;\nconsole.log(card);"
        q['answer'] = "const name = 'Shaina Zehra', age = 20, city = 'Lahore';\nconst card = `Name: ${name}\nAge: ${age}\nCity: ${city}`;\nconsole.log(card);"
        updated_count += 1
    elif qid == 231:
        q['starterCode'] = "function describe(name, age) {\n  return /* template literal */;\n}\nconsole.log(describe('Hussain Mehdi', 21));"
        q['answer'] = "function describe(name, age) {\n  return `${name} is ${age} years old.`;\n}\nconsole.log(describe('Hussain Mehdi', 21));"
        updated_count += 1

with open(filepath, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Successfully updated {updated_count} questions with student names!")
